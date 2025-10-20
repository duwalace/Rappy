/**
 * SERVIÇO DE ENDEREÇOS
 * 
 * Gerencia CRUD completo de endereços com integração ViaCEP
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { Address, AddressFormData, ViaCEPResponse } from '../types/profile';

const USERS_COLLECTION = 'users';
const ADDRESSES_SUBCOLLECTION = 'addresses';

/**
 * INTEGRAÇÃO COM VIACEP
 * Busca informações de endereço automaticamente pelo CEP
 */
export const fetchAddressByCEP = async (cep: string): Promise<ViaCEPResponse> => {
  try {
    const cleanCEP = cep.replace(/\D/g, '');
    
    if (cleanCEP.length !== 8) {
      throw new Error('CEP deve conter 8 dígitos');
    }

    const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
    
    if (!response.ok) {
      throw new Error('Erro ao buscar CEP');
    }

    const data: ViaCEPResponse = await response.json();

    if (data.erro) {
      throw new Error('CEP não encontrado');
    }

    return data;
  } catch (error: any) {
    console.error('Erro ao buscar CEP:', error);
    throw new Error(error.message || 'Não foi possível buscar o CEP');
  }
};

/**
 * Listar todos os endereços do usuário
 * Ordenado por: Padrão primeiro, depois mais recentes
 */
export const getAddresses = async (userId: string): Promise<Address[]> => {
  try {
    const addressesRef = collection(
      db,
      USERS_COLLECTION,
      userId,
      ADDRESSES_SUBCOLLECTION
    );

    // Buscar todos sem ordenação composta (evita necessidade de índice)
    const q = query(addressesRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    const addresses = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        userId,
        label: data.label,
        zipCode: data.zipCode,
        street: data.street,
        number: data.number,
        complement: data.complement,
        neighborhood: data.neighborhood,
        city: data.city,
        state: data.state,
        reference: data.reference,
        isDefault: data.isDefault || false,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    });

    // Ordenar localmente: padrão primeiro, depois por data
    return addresses.sort((a, b) => {
      // Primeiro, ordenar por isDefault (padrão primeiro)
      if (a.isDefault !== b.isDefault) {
        return a.isDefault ? -1 : 1;
      }
      // Depois, ordenar por data (mais recente primeiro)
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  } catch (error) {
    console.error('Erro ao buscar endereços:', error);
    throw new Error('Não foi possível carregar os endereços');
  }
};

/**
 * Buscar um endereço específico
 */
export const getAddressById = async (
  userId: string,
  addressId: string
): Promise<Address | null> => {
  try {
    const addressDoc = await getDoc(
      doc(db, USERS_COLLECTION, userId, ADDRESSES_SUBCOLLECTION, addressId)
    );

    if (!addressDoc.exists()) {
      return null;
    }

    const data = addressDoc.data();
    return {
      id: addressDoc.id,
      userId,
      label: data.label,
      zipCode: data.zipCode,
      street: data.street,
      number: data.number,
      complement: data.complement,
      neighborhood: data.neighborhood,
      city: data.city,
      state: data.state,
      isDefault: data.isDefault || false,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };
  } catch (error) {
    console.error('Erro ao buscar endereço:', error);
    throw new Error('Não foi possível carregar o endereço');
  }
};

/**
 * Verificar se já existe um endereço duplicado
 * Compara CEP + número para determinar duplicação
 */
export const checkDuplicateAddress = async (
  userId: string,
  zipCode: string,
  number: string,
  street: string
): Promise<boolean> => {
  try {
    const addressesRef = collection(
      db,
      USERS_COLLECTION,
      userId,
      ADDRESSES_SUBCOLLECTION
    );

    const snapshot = await getDocs(addressesRef);
    
    // Normalizar dados para comparação
    const cleanZipCode = zipCode.replace(/\D/g, '');
    const normalizedNumber = number.trim().toLowerCase();
    const normalizedStreet = street.trim().toLowerCase();

    // Verificar se existe endereço com mesmo CEP + número + rua
    const hasDuplicate = snapshot.docs.some((doc) => {
      const data = doc.data();
      const docZipCode = data.zipCode?.replace(/\D/g, '');
      const docNumber = data.number?.trim().toLowerCase();
      const docStreet = data.street?.trim().toLowerCase();

      return (
        docZipCode === cleanZipCode &&
        docNumber === normalizedNumber &&
        docStreet === normalizedStreet
      );
    });

    return hasDuplicate;
  } catch (error) {
    console.error('Erro ao verificar duplicação:', error);
    // Em caso de erro, permitir continuar (não bloquear o usuário)
    return false;
  }
};

/**
 * Adicionar novo endereço
 * 
 * Se for marcado como padrão, remove o padrão dos outros
 * Verifica duplicação antes de salvar
 */
export const addAddress = async (
  userId: string,
  data: AddressFormData
): Promise<string> => {
  try {
    // Validações
    if (!data.zipCode || data.zipCode.replace(/\D/g, '').length !== 8) {
      throw new Error('CEP inválido');
    }

    if (!data.street || data.street.trim().length < 3) {
      throw new Error('Rua/Avenida deve ter pelo menos 3 caracteres');
    }

    if (!data.number || data.number.trim().length === 0) {
      throw new Error('Número é obrigatório');
    }

    if (!data.neighborhood || data.neighborhood.trim().length < 3) {
      throw new Error('Bairro deve ter pelo menos 3 caracteres');
    }

    if (!data.city || data.city.trim().length < 3) {
      throw new Error('Cidade deve ter pelo menos 3 caracteres');
    }

    if (!data.state || data.state.length !== 2) {
      throw new Error('Estado deve ter 2 caracteres (ex: SP)');
    }

    // ⚠️ VERIFICAR DUPLICAÇÃO
    const isDuplicate = await checkDuplicateAddress(
      userId,
      data.zipCode,
      data.number,
      data.street
    );

    if (isDuplicate) {
      throw new Error('DUPLICATE_ADDRESS');
    }

    const addressesRef = collection(
      db,
      USERS_COLLECTION,
      userId,
      ADDRESSES_SUBCOLLECTION
    );

    // Se for marcado como padrão, remove o padrão dos outros
    if (data.isDefault) {
      await removeDefaultFromOthers(userId);
    }

    // Adicionar novo endereço
    const docRef = await addDoc(addressesRef, {
      ...data,
      zipCode: data.zipCode.replace(/\D/g, ''),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    console.log('✅ Endereço adicionado:', docRef.id);
    return docRef.id;
  } catch (error: any) {
    console.error('❌ Erro ao adicionar endereço:', error);
    throw error;
  }
};

/**
 * Atualizar endereço existente
 */
export const updateAddress = async (
  userId: string,
  addressId: string,
  data: Partial<AddressFormData>
): Promise<void> => {
  try {
    const addressRef = doc(
      db,
      USERS_COLLECTION,
      userId,
      ADDRESSES_SUBCOLLECTION,
      addressId
    );

    // Se for marcado como padrão, remove o padrão dos outros
    if (data.isDefault) {
      await removeDefaultFromOthers(userId, addressId);
    }

    // Limpar CEP se fornecido
    if (data.zipCode) {
      data.zipCode = data.zipCode.replace(/\D/g, '');
    }

    await updateDoc(addressRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });

    console.log('✅ Endereço atualizado:', addressId);
  } catch (error) {
    console.error('❌ Erro ao atualizar endereço:', error);
    throw new Error('Não foi possível atualizar o endereço');
  }
};

/**
 * Deletar endereço
 */
export const deleteAddress = async (
  userId: string,
  addressId: string
): Promise<void> => {
  try {
    const addressRef = doc(
      db,
      USERS_COLLECTION,
      userId,
      ADDRESSES_SUBCOLLECTION,
      addressId
    );

    await deleteDoc(addressRef);
    console.log('✅ Endereço deletado:', addressId);
  } catch (error) {
    console.error('❌ Erro ao deletar endereço:', error);
    throw new Error('Não foi possível deletar o endereço');
  }
};

/**
 * Definir um endereço como padrão
 */
export const setDefaultAddress = async (
  userId: string,
  addressId: string
): Promise<void> => {
  try {
    await removeDefaultFromOthers(userId, addressId);

    const addressRef = doc(
      db,
      USERS_COLLECTION,
      userId,
      ADDRESSES_SUBCOLLECTION,
      addressId
    );

    await updateDoc(addressRef, {
      isDefault: true,
      updatedAt: serverTimestamp(),
    });

    console.log('✅ Endereço definido como padrão:', addressId);
  } catch (error) {
    console.error('❌ Erro ao definir endereço padrão:', error);
    throw new Error('Não foi possível definir o endereço padrão');
  }
};

/**
 * Remove a flag de padrão de todos os outros endereços
 * (Helper function)
 */
const removeDefaultFromOthers = async (
  userId: string,
  exceptAddressId?: string
): Promise<void> => {
  try {
    const addressesRef = collection(
      db,
      USERS_COLLECTION,
      userId,
      ADDRESSES_SUBCOLLECTION
    );

    const q = query(addressesRef, where('isDefault', '==', true));
    const snapshot = await getDocs(q);

    const batch = writeBatch(db);

    snapshot.docs.forEach((doc) => {
      if (doc.id !== exceptAddressId) {
        batch.update(doc.ref, { isDefault: false });
      }
    });

    await batch.commit();
  } catch (error) {
    console.error('Erro ao remover padrão dos outros:', error);
    // Não lançar erro aqui para não bloquear a operação principal
  }
};

/**
 * Formatar CEP para exibição
 * Converte 01310100 para 01310-100
 */
export const formatCEP = (cep: string): string => {
  const cleaned = cep.replace(/\D/g, '');
  if (cleaned.length === 8) {
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
  }
  return cep;
};

/**
 * Máscara de CEP enquanto digita
 */
export const maskCEP = (value: string): string => {
  const cleaned = value.replace(/\D/g, '').substring(0, 8);
  if (cleaned.length > 5) {
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
  }
  return cleaned;
};

