import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { v4 as uuidv4 } from 'uuid';
import timezone from 'dayjs/plugin/timezone';
import { useMemo, useState, useEffect } from 'react';
import { ref, deleteObject } from 'firebase/storage';
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  onSnapshot,
  getFirestore,
} from 'firebase/firestore';

import { storage } from 'src/utils/firebase';

// Ajouter les plugins dayjs
dayjs.extend(utc);
dayjs.extend(timezone);

// Constante pour le fuseau horaire de la Martinique (comme dans calendar)
const MARTINIQUE_TIMEZONE = 'America/Martinique';


const db = getFirestore();

// ----------------------------------------------------------------------

export function useGetBoard() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const boardRef = doc(db, 'boards', 'main-board');

    const unsubscribe = onSnapshot(boardRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          setData(docSnapshot.data());
        } else {
          setError('No board data found');
        }
        setIsLoading(false);
      },
      (err) => {
        setError(`Error fetching board data: ${err.message}`);
        setIsLoading(false);
      }
    );

    // Cleanup function to unsubscribe from the listener when the component unmounts
    return () => unsubscribe();
  }, []);

  const memoizedValue = useMemo(() => {
    const tasks = data?.board?.tasks ?? {};
    const columns = data?.board?.columns ?? [];

    return {
      board: { tasks, columns },
      boardLoading: isLoading,
      boardError: error,
      boardEmpty: !isLoading && !columns.length,
    };
  }, [data, error, isLoading]);

  return memoizedValue;
}

// ----------------------------------------------------------------------

export async function createColumn(columnData) {
  try {
    const boardRef = doc(db, 'boards', 'main-board');

    // Utiliser le nom fourni ou 'Untitled' si le nom est vide
    const columnName = columnData.name.trim() || 'Untitled';

    // Générer un nouvel ID unique pour la colonne avec le format demandé
    const newColumnId = `column-${columnName}-${uuidv4()}`;

    // Créer l'objet de la nouvelle colonne
    const newColumn = {
      id: newColumnId,
      name: columnName,
      // Ajoutez d'autres propriétés si nécessaire
    };

    // Mettre à jour le tableau des colonnes et créer une entrée vide pour les tâches
    await updateDoc(boardRef, {
      'board.columns': arrayUnion(newColumn),
      [`board.tasks.${newColumnId}`]: []
    });

    console.log('New column created successfully');
    return newColumn;
  } catch (error) {
    console.error('Error creating new column:', error);
    throw error;
  }
}

// ----------------------------------------------------------------------

export async function updateColumn(columnId, columnName) {
  try {
    const boardRef = doc(db, 'boards', 'main-board');

    // Utiliser le nom fourni ou 'Untitled' si le nom est vide
    const newColumnName = columnName.trim() || 'Untitled';

    // Récupérer les données actuelles du tableau
    const boardSnapshot = await getDoc(boardRef);
    const boardData = boardSnapshot.data();

    if (!boardData || !boardData.board || !boardData.board.columns) {
      throw new Error('Invalid board structure');
    }

    // Trouver l'index de la colonne à mettre à jour
    const { columns } = boardData.board;
    const columnIndex = columns.findIndex((column) => column.id === columnId);

    if (columnIndex === -1) {
      throw new Error(`Column with ID ${columnId} not found`);
    }

    // Mettre à jour le nom de la colonne
    columns[columnIndex].name = newColumnName;

    // Mettre à jour les données du tableau avec updateDoc
    await updateDoc(boardRef, {
      'board.columns': columns
    });

    console.log(`Column ${columnId} updated successfully to ${newColumnName}`);
    return { id: columnId, name: newColumnName };
  } catch (error) {
    console.error('Error updating column:', error);
    throw error;
  }
}


// ----------------------------------------------------------------------

export async function moveColumn(updateColumns) {
  // updateColumns est un objet avec les colonnes mises à jour qui doit remplacer les colonnes actuelles avec une lecture en temps réel

  try {
    const boardRef = doc(db, 'boards', 'main-board');

    // Mettre à jour les colonnes du tableau
    await updateDoc(boardRef, {
      'board.columns': updateColumns
    });

    console.log('Columns moved successfully');
  } catch (error) {
    console.error('Error moving columns:', error);
    throw error;
  }
}

// ----------------------------------------------------------------------

export async function clearColumn(columnId) {
  // Supprime toutes les tâches de la colonne

  try {
    const boardRef = doc(db, 'boards', 'main-board');

    // Supprimer toutes les tâches de la colonne
    await updateDoc(boardRef, {
      [`board.tasks.${columnId}`]: []
    });

    console.log(`Tasks in column ${columnId} cleared successfully`);
  } catch (error) {
    console.error('Error clearing tasks:', error);
    throw error;
  }
}

// ----------------------------------------------------------------------

export async function deleteColumn(columnId) {
  try {
    const boardRef = doc(db, 'boards', 'main-board');

    // Récupérer les données actuelles du tableau
    const boardSnapshot = await getDoc(boardRef);
    const boardData = boardSnapshot.data();

    if (!boardData || !boardData.board || !boardData.board.columns) {
      throw new Error('Invalid board structure');
    }

    // Filtrer les colonnes pour supprimer la colonne avec l'ID fourni
    const updatedColumns = boardData.board.columns.filter((column) => column.id !== columnId);

    // Supprimer le tableau de tâches associé à la colonne
    delete boardData.board.tasks[columnId];

    // Mettre à jour les données du tableau avec updateDoc
    await updateDoc(boardRef, {
      'board.columns': updatedColumns,
      'board.tasks': boardData.board.tasks
    });

    console.log(`Column ${columnId} deleted successfully`);
  } catch (error) {
    console.error('Error deleting column:', error);
    throw error;
  }
}


// ----------------------------------------------------------------------

export async function createTask(columnId, taskData, userId) {
  try {
    const boardRef = doc(db, 'boards', 'main-board');

    // Formater les dates avec le fuseau horaire fixe de la Martinique
    // sans conversion (simplement ajouter le nom du fuseau horaire)
    const currentDate = dayjs().format('YYYY-MM-DDTHH:mm:ss');
    const nextDay = dayjs().add(1, 'day').format('YYYY-MM-DDTHH:mm:ss');

    // S'assurer que toutes les valeurs sont définies
    const newTask = {
      id: taskData.id || crypto.randomUUID(),
      status: columnId, // Utiliser l'ID de la colonne comme status
      name: taskData.name || 'Untitled',
      priority: taskData.priority || 'medium',
      attachments: taskData.attachments || [],
      description: taskData.description || '',
      labels: taskData.labels || [],
      comments: taskData.comments || [],
      assignee: taskData.assignee || [],
      // Utiliser les dates formatées sans conversion
      due: taskData.due || [currentDate, nextDay],
      createdAt: currentDate,
      updatedAt: currentDate,
      createdBy: userId || null,
      updatedBy: userId || null,
      // Ajouter le fuseau horaire fixe pour la compatibilité avec le reste du système
      timezone: MARTINIQUE_TIMEZONE,
      reporter: {
        id: userId || null,
        name: taskData.reporter?.name || 'Anonymous',
        avatarUrl: taskData.reporter?.avatarUrl || null,
        email: taskData.reporter?.email || null,
        role: taskData.reporter?.role || null,
        roleLevel: taskData.reporter?.roleLevel || 0,
        isVerified: taskData.reporter?.isVerified || false,
      }
    };

    // Mettre à jour le tableau des tâches de la colonne avec la nouvelle tâche
    await updateDoc(boardRef, {
      [`board.tasks.${columnId}`]: arrayUnion(newTask)
    });

    console.log('New task created successfully');
    return newTask;
  } catch (error) {
    console.error('Error creating new task:', error);
    throw error;
  }
}

// ----------------------------------------------------------------------

export async function updateTask(columnId, taskData) {
  try {
    const boardRef = doc(db, 'boards', 'main-board');

    // Récupérer les données actuelles du tableau
    const boardSnapshot = await getDoc(boardRef);
    const boardData = boardSnapshot.data();

    if (!boardData || !boardData.board || !boardData.board.tasks) {
      throw new Error('Invalid board structure');
    }

    // Vérifier si la colonne de destination existe
    const columnExists = boardData.board.columns.some(col => col.id === taskData.status);
    if (!columnExists) {
      throw new Error(`Column with ID ${taskData.status} does not exist`);
    }

    // Trouver l'index de la tâche à mettre à jour
    const { tasks } = boardData.board;
    const columnTasks = tasks[columnId];
    const taskIndex = columnTasks.findIndex((task) => task.id === taskData.id);

    if (taskIndex === -1) {
      throw new Error(`Task with ID ${taskData.id} not found in column ${columnId}`);
    }

    // Formatage de la date actuelle sans conversion de fuseau horaire
    const currentDate = dayjs().format('YYYY-MM-DDTHH:mm:ss');

    // Traitement des dates dans taskData pour standardiser le format
    const processedTaskData = { ...taskData };

    // Si le taskData contient une propriété 'due', nous nous assurons qu'elle soit formatée correctement
    if (processedTaskData.due && Array.isArray(processedTaskData.due)) {
      processedTaskData.due = processedTaskData.due.map(date => {
        // Si c'est déjà une chaîne au format simple YYYY-MM-DDTHH:mm:ss, la garder telle quelle
        // Sinon, reformater pour éliminer le suffixe de fuseau horaire
        if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/)) {
          return date;
        }
        return dayjs(date).format('YYYY-MM-DDTHH:mm:ss');
      });
    }

    // Mettre à jour les données de la tâche avec le timestamp et l'utilisateur
    const updatedTask = {
      ...columnTasks[taskIndex],
      ...processedTaskData,
      updatedAt: currentDate,
      updatedBy: processedTaskData.updatedBy || columnTasks[taskIndex].updatedBy,
      // Assurer que le fuseau horaire est toujours défini
      timezone: MARTINIQUE_TIMEZONE,
      reporter: {
        ...columnTasks[taskIndex].reporter,
        ...processedTaskData.reporter,
      },
    };

    // Si le status (colonne) a changé, déplacer la tâche
    if (columnId !== taskData.status) {
      // Supprimer la tâche de l'ancienne colonne
      const updatedOldColumnTasks = columnTasks.filter(task => task.id !== taskData.id);

      // Ajouter la tâche à la nouvelle colonne
      const newColumnTasks = tasks[taskData.status] || [];
      newColumnTasks.push(updatedTask);

      // Mettre à jour les deux colonnes
      await updateDoc(boardRef, {
        [`board.tasks.${columnId}`]: updatedOldColumnTasks,
        [`board.tasks.${taskData.status}`]: newColumnTasks
      });
    } else {
      // Si la tâche reste dans la même colonne, mettre à jour uniquement cette colonne
      columnTasks[taskIndex] = updatedTask;
      await updateDoc(boardRef, {
        [`board.tasks.${columnId}`]: columnTasks
      });
    }

    console.log(`Task ${taskData.id} updated successfully`);
    return updatedTask;
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
}

// ----------------------------------------------------------------------

export async function moveTask(updateTasks) {
  // updateTasks est un objet avec les tâches mises à jour qui doit remplacer les tâches actuelles

  try {
    const boardRef = doc(db, 'boards', 'main-board');

    // Mettre à jour les tâches du tableau
    await updateDoc(boardRef, {
      'board.tasks': updateTasks
    });

    console.log('Tasks moved successfully');
  } catch (error) {
    console.error('Error moving tasks:', error);
    throw error;
  }
}

// ----------------------------------------------------------------------

export async function deleteTask(columnId, taskId) {
  try {
    const boardRef = doc(db, 'boards', 'main-board');

    // Récupérer les données actuelles du tableau
    const boardSnapshot = await getDoc(boardRef);
    const boardData = boardSnapshot.data();

    if (!boardData || !boardData.board || !boardData.board.tasks) {
      throw new Error('Invalid board structure');
    }

    // Trouver la tâche à supprimer pour récupérer ses pièces jointes
    const taskToDelete = boardData.board.tasks[columnId].find((task) => task.id === taskId);
    if (!taskToDelete) {
      throw new Error(`Task ${taskId} not found in column ${columnId}`);
    }

    // Supprimer les pièces jointes du Storage
    if (taskToDelete.attachments && taskToDelete.attachments.length > 0) {
      const deletePromises = taskToDelete.attachments.map(async (attachment) => {
        if (attachment.path) {
          const storageRef = ref(storage, attachment.path);
          try {
            await deleteObject(storageRef);
          } catch (error) {
            console.warn(`Error deleting attachment ${attachment.path}:`, error);
          }
        }
      });
      await Promise.all(deletePromises);
    }

    // Filtrer les tâches pour supprimer la tâche avec l'ID fourni
    const updatedTasks = boardData.board.tasks[columnId].filter((task) => task.id !== taskId);

    // Mettre à jour les données du tableau avec updateDoc
    await updateDoc(boardRef, {
      [`board.tasks.${columnId}`]: updatedTasks
    });

    console.log(`Task ${taskId} deleted successfully`);
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
}
