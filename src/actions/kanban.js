import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { v4 as uuidv4 } from 'uuid';
import timezone from 'dayjs/plugin/timezone';
import { useMemo, useState, useEffect } from 'react';
import { ref, uploadBytes, deleteObject, getDownloadURL } from 'firebase/storage';
import {
  doc,
  getDoc,
  setDoc,
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

    // console.log('New column created successfully');
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

    // console.log(`Column ${columnId} updated successfully to ${newColumnName}`);
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

    // console.log('Columns moved successfully');
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

    // console.log(`Tasks in column ${columnId} cleared successfully`);
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

    // console.log(`Column ${columnId} deleted successfully`);
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

    // console.log('New task created successfully');
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

    // console.log(`Task ${taskData.id} updated successfully`);
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

    // console.log('Tasks moved successfully');
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

    // console.log(`Task ${taskId} deleted successfully`);
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
}

// ----------------------------------------------------------------------

export async function addSubtask(columnId, taskId, subtaskData) {
  try {
    const boardRef = doc(db, 'boards', 'main-board');

    // Récupérer les données actuelles du tableau
    const boardSnapshot = await getDoc(boardRef);
    const boardData = boardSnapshot.data();

    if (!boardData || !boardData.board || !boardData.board.tasks) {
      throw new Error('Invalid board structure');
    }

    // Trouver la tâche à mettre à jour
    const { tasks } = boardData.board;
    const columnTasks = tasks[columnId];
    const taskIndex = columnTasks.findIndex((task) => task.id === taskId);

    if (taskIndex === -1) {
      throw new Error(`Task with ID ${taskId} not found in column ${columnId}`);
    }

    // Créer la nouvelle sous-tâche
    const newSubtask = {
      id: crypto.randomUUID(),
      name: subtaskData.name,
      completed: false,
      createdAt: dayjs().format('YYYY-MM-DDTHH:mm:ss'),
      updatedAt: dayjs().format('YYYY-MM-DDTHH:mm:ss'),
      createdBy: subtaskData.userId || null,
      updatedBy: subtaskData.userId || null,
    };

    // Initialiser le tableau des sous-tâches s'il n'existe pas
    if (!columnTasks[taskIndex].subtasks) {
      columnTasks[taskIndex].subtasks = [];
    }

    // Ajouter la nouvelle sous-tâche
    columnTasks[taskIndex].subtasks.push(newSubtask);

    // Mettre à jour la tâche dans Firestore
    await updateDoc(boardRef, {
      [`board.tasks.${columnId}`]: columnTasks
    });

    // console.log('New subtask added successfully');
    return newSubtask;
  } catch (error) {
    console.error('Error adding subtask:', error);
    throw error;
  }
}

// ----------------------------------------------------------------------

export async function updateSubtask(columnId, taskId, subtaskId, subtaskData) {
  try {
    const boardRef = doc(db, 'boards', 'main-board');

    // Récupérer les données actuelles du tableau
    const boardSnapshot = await getDoc(boardRef);
    const boardData = boardSnapshot.data();

    if (!boardData || !boardData.board || !boardData.board.tasks) {
      throw new Error('Invalid board structure');
    }

    // Trouver la tâche à mettre à jour
    const { tasks } = boardData.board;
    const columnTasks = tasks[columnId];
    const taskIndex = columnTasks.findIndex((task) => task.id === taskId);

    if (taskIndex === -1) {
      throw new Error(`Task with ID ${taskId} not found in column ${columnId}`);
    }

    // Trouver l'index de la sous-tâche à mettre à jour
    const subtaskIndex = columnTasks[taskIndex].subtasks.findIndex(
      (subtask) => subtask.id === subtaskId
    );

    if (subtaskIndex === -1) {
      throw new Error(`Subtask with ID ${subtaskId} not found`);
    }

    // Mettre à jour la sous-tâche
    columnTasks[taskIndex].subtasks[subtaskIndex] = {
      ...columnTasks[taskIndex].subtasks[subtaskIndex],
      ...subtaskData,
      updatedAt: dayjs().format('YYYY-MM-DDTHH:mm:ss'),
      updatedBy: subtaskData.userId || columnTasks[taskIndex].subtasks[subtaskIndex].updatedBy,
    };

    // Mettre à jour la tâche dans Firestore
    await updateDoc(boardRef, {
      [`board.tasks.${columnId}`]: columnTasks
    });

    // console.log('Subtask updated successfully');
    return columnTasks[taskIndex].subtasks[subtaskIndex];
  } catch (error) {
    console.error('Error updating subtask:', error);
    throw error;
  }
}

// ----------------------------------------------------------------------

export async function deleteSubtask(columnId, taskId, subtaskId) {
  try {
    const boardRef = doc(db, 'boards', 'main-board');

    // Récupérer les données actuelles du tableau
    const boardSnapshot = await getDoc(boardRef);
    const boardData = boardSnapshot.data();

    if (!boardData || !boardData.board || !boardData.board.tasks) {
      throw new Error('Invalid board structure');
    }

    // Trouver la tâche à mettre à jour
    const { tasks } = boardData.board;
    const columnTasks = tasks[columnId];
    const taskIndex = columnTasks.findIndex((task) => task.id === taskId);

    if (taskIndex === -1) {
      throw new Error(`Task with ID ${taskId} not found in column ${columnId}`);
    }

    // Filtrer la sous-tâche à supprimer
    columnTasks[taskIndex].subtasks = columnTasks[taskIndex].subtasks.filter(
      (subtask) => subtask.id !== subtaskId
    );

    // Mettre à jour la tâche dans Firestore
    await updateDoc(boardRef, {
      [`board.tasks.${columnId}`]: columnTasks
    });

    // console.log('Subtask deleted successfully');
  } catch (error) {
    console.error('Error deleting subtask:', error);
    throw error;
  }
}

// ----------------------------------------------------------------------

export async function getAvailableLabels() {
  try {
    const labelsRef = doc(db, 'settings', 'Étiquettes');
    const labelsSnapshot = await getDoc(labelsRef);

    if (!labelsSnapshot.exists()) {
      // Créer le document avec quelques étiquettes par défaut
      const defaultLabels = ['Urgent', 'Important', 'En attente', 'En cours', 'Terminé', 'Bug', 'Feature'];
      await setDoc(labelsRef, { labels: defaultLabels });
      return defaultLabels;
    }

    return labelsSnapshot.data().labels || [];
  } catch (error) {
    console.error('Error getting available labels:', error);
    throw error;
  }
}

// ----------------------------------------------------------------------

export async function addAvailableLabel(labelName) {
  try {
    const labelsRef = doc(db, 'settings', 'Étiquettes');
    const labelsSnapshot = await getDoc(labelsRef);

    let currentLabels = [];
    if (labelsSnapshot.exists()) {
      currentLabels = labelsSnapshot.data().labels || [];
    }

    // Vérifier si l'étiquette existe déjà
    if (currentLabels.includes(labelName)) {
      return labelName; // L'étiquette existe déjà, pas besoin de l'ajouter
    }

    // Ajouter la nouvelle étiquette
    const updatedLabels = [...currentLabels, labelName];

    // Mettre à jour ou créer le document
    await setDoc(labelsRef, { labels: updatedLabels }, { merge: true });

    // console.log('New available label added successfully');
    return labelName;
  } catch (error) {
    console.error('Error adding available label:', error);
    throw error;
  }
}

// ----------------------------------------------------------------------

export async function deleteAvailableLabel(labelName) {
  try {
    const labelsRef = doc(db, 'settings', 'Étiquettes');
    const labelsSnapshot = await getDoc(labelsRef);

    if (!labelsSnapshot.exists()) {
      throw new Error('Labels document does not exist');
    }

    const currentLabels = labelsSnapshot.data().labels || [];

    // Vérifier si l'étiquette existe
    if (!currentLabels.includes(labelName)) {
      throw new Error('Label not found in available labels');
    }

    // Supprimer l'étiquette
    const updatedLabels = currentLabels.filter(label => label !== labelName);

    // Mettre à jour le document
    await setDoc(labelsRef, { labels: updatedLabels });

    // console.log('Available label deleted successfully');
  } catch (error) {
    console.error('Error deleting available label:', error);
    throw error;
  }
}

// ----------------------------------------------------------------------

export async function addLabel(columnId, taskId, labelName) {
  try {
    const boardRef = doc(db, 'boards', 'main-board');

    // Récupérer les données actuelles du tableau
    const boardSnapshot = await getDoc(boardRef);
    const boardData = boardSnapshot.data();

    if (!boardData || !boardData.board || !boardData.board.tasks) {
      throw new Error('Invalid board structure');
    }

    // Trouver la tâche à mettre à jour
    const { tasks } = boardData.board;
    const columnTasks = tasks[columnId];
    const taskIndex = columnTasks.findIndex((task) => task.id === taskId);

    if (taskIndex === -1) {
      throw new Error(`Task with ID ${taskId} not found in column ${columnId}`);
    }

    // Initialiser le tableau des étiquettes s'il n'existe pas
    if (!columnTasks[taskIndex].labels) {
      columnTasks[taskIndex].labels = [];
    }

    // Vérifier si l'étiquette existe déjà dans la tâche
    if (columnTasks[taskIndex].labels.includes(labelName)) {
      return labelName;
    }

    // Ajouter l'étiquette à la tâche
    columnTasks[taskIndex].labels.push(labelName);

    // Mettre à jour la tâche dans Firestore
    await updateDoc(boardRef, {
      [`board.tasks.${columnId}`]: columnTasks
    });

    // S'assurer que l'étiquette est disponible globalement
    await addAvailableLabel(labelName);

    // console.log('Label added successfully to task and global list');
    return labelName;
  } catch (error) {
    console.error('Error adding label:', error);
    throw error;
  }
}

// ----------------------------------------------------------------------

export async function updateLabel(columnId, taskId, oldLabel, newLabel) {
  try {
    const boardRef = doc(db, 'boards', 'main-board');

    // Récupérer les données actuelles du tableau
    const boardSnapshot = await getDoc(boardRef);
    const boardData = boardSnapshot.data();

    if (!boardData || !boardData.board || !boardData.board.tasks) {
      throw new Error('Invalid board structure');
    }

    // Trouver la tâche à mettre à jour
    const { tasks } = boardData.board;
    const columnTasks = tasks[columnId];
    const taskIndex = columnTasks.findIndex((task) => task.id === taskId);

    if (taskIndex === -1) {
      throw new Error(`Task with ID ${taskId} not found in column ${columnId}`);
    }

    // Vérifier si l'ancienne étiquette existe
    if (!columnTasks[taskIndex].labels.includes(oldLabel)) {
      throw new Error('Old label not found');
    }

    // Vérifier si la nouvelle étiquette existe déjà
    if (columnTasks[taskIndex].labels.includes(newLabel)) {
      throw new Error('New label already exists');
    }

    // Mettre à jour l'étiquette
    columnTasks[taskIndex].labels = columnTasks[taskIndex].labels.map(
      (label) => (label === oldLabel ? newLabel : label)
    );

    // Mettre à jour la tâche dans Firestore
    await updateDoc(boardRef, {
      [`board.tasks.${columnId}`]: columnTasks
    });

    // console.log('Label updated successfully');
    return newLabel;
  } catch (error) {
    console.error('Error updating label:', error);
    throw error;
  }
}

// ----------------------------------------------------------------------

export async function deleteLabel(columnId, taskId, labelName) {
  try {
    const boardRef = doc(db, 'boards', 'main-board');

    // Récupérer les données actuelles du tableau
    const boardSnapshot = await getDoc(boardRef);
    const boardData = boardSnapshot.data();

    if (!boardData || !boardData.board || !boardData.board.tasks) {
      throw new Error('Invalid board structure');
    }

    // Trouver la tâche à mettre à jour
    const { tasks } = boardData.board;
    const columnTasks = tasks[columnId];
    const taskIndex = columnTasks.findIndex((task) => task.id === taskId);

    if (taskIndex === -1) {
      throw new Error(`Task with ID ${taskId} not found in column ${columnId}`);
    }

    // Vérifier si l'étiquette existe
    if (!columnTasks[taskIndex].labels.includes(labelName)) {
      throw new Error('Label not found');
    }

    // Supprimer l'étiquette
    columnTasks[taskIndex].labels = columnTasks[taskIndex].labels.filter(
      (label) => label !== labelName
    );

    // Mettre à jour la tâche dans Firestore
    await updateDoc(boardRef, {
      [`board.tasks.${columnId}`]: columnTasks
    });

    // console.log('Label deleted successfully');
  } catch (error) {
    console.error('Error deleting label:', error);
    throw error;
  }
}

// ----------------------------------------------------------------------

export async function addComment(columnId, taskId, commentData) {
  try {
    // console.log('Adding comment with:', { columnId, taskId, commentData });

    const boardRef = doc(db, 'boards', 'main-board');

    // Récupérer les données actuelles du tableau
    const boardSnapshot = await getDoc(boardRef);
    // console.log('Board snapshot exists:', boardSnapshot.exists());

    if (!boardSnapshot.exists()) {
      throw new Error('Board document not found');
    }

    const boardData = boardSnapshot.data();
    // console.log('Board data structure:', {
    //   hasBoard: !!boardData.board,
    //   hasTasks: !!boardData.board?.tasks,
    //   hasColumn: !!boardData.board?.tasks[columnId]
    // });

    if (!boardData || !boardData.board || !boardData.board.tasks) {
      throw new Error('Invalid board structure');
    }

    // Trouver la tâche
    const { tasks } = boardData.board;
    const columnTasks = tasks[columnId];
    // console.log('Column tasks array:', { length: columnTasks?.length, isArray: Array.isArray(columnTasks) });

    if (!Array.isArray(columnTasks)) {
      throw new Error(`No tasks array found for column ${columnId}`);
    }

    const taskIndex = columnTasks.findIndex((task) => task.id === taskId);
    // console.log('Task index:', taskIndex);

    if (taskIndex === -1) {
      throw new Error(`Task with ID ${taskId} not found in column ${columnId}`);
    }

    // Vérifier si le tableau comments existe déjà
    // console.log('Current comments array:', columnTasks[taskIndex].comments);

    // Initialiser le tableau des commentaires s'il n'existe pas
    if (!columnTasks[taskIndex].comments) {
      // console.log('Creating new comments array');
      columnTasks[taskIndex].comments = [];
    }

    // Créer le nouveau commentaire
    const newComment = {
      id: crypto.randomUUID(),
      message: commentData.message,
      messageType: commentData.messageType || 'text',
      name: commentData.name,
      avatarUrl: commentData.avatarUrl,
      createdAt: dayjs().format('YYYY-MM-DDTHH:mm:ss'),
      updatedAt: dayjs().format('YYYY-MM-DDTHH:mm:ss'),
      createdBy: commentData.createdBy,
      updatedBy: commentData.updatedBy,
      email: commentData.email,
      role: commentData.role,
      roleLevel: commentData.roleLevel,
    };

    // console.log('New comment object:', newComment);

    // Ajouter le nouveau commentaire au début du tableau
    columnTasks[taskIndex].comments.unshift(newComment);
    // console.log('Updated comments array length:', columnTasks[taskIndex].comments.length);

    // Mettre à jour la tâche dans Firestore
    const updateData = {
      [`board.tasks.${columnId}`]: columnTasks
    };

    // console.log('Updating Firestore with data path:', `board.tasks.${columnId}`);

    try {
      await updateDoc(boardRef, updateData);
      // console.log('Firestore update successful');
    } catch (updateError) {
      console.error('Firestore update failed:', updateError);
      throw updateError;
    }

    return newComment;
  } catch (error) {
    console.error('Error in addComment function:', error);
    throw error;
  }
}

// ----------------------------------------------------------------------

export async function updateComment(columnId, taskId, commentId, commentData) {
  try {
    const boardRef = doc(db, 'boards', 'main-board');

    // Récupérer les données actuelles du tableau
    const boardSnapshot = await getDoc(boardRef);
    const boardData = boardSnapshot.data();

    if (!boardData || !boardData.board || !boardData.board.tasks) {
      throw new Error('Invalid board structure');
    }

    // Trouver la tâche à mettre à jour
    const { tasks } = boardData.board;
    const columnTasks = tasks[columnId];
    const taskIndex = columnTasks.findIndex((task) => task.id === taskId);

    if (taskIndex === -1) {
      throw new Error(`Task with ID ${taskId} not found in column ${columnId}`);
    }

    // Trouver l'index du commentaire à mettre à jour
    const commentIndex = columnTasks[taskIndex].comments.findIndex(
      (comment) => comment.id === commentId
    );

    if (commentIndex === -1) {
      throw new Error(`Comment with ID ${commentId} not found`);
    }

    // Mettre à jour le commentaire
    columnTasks[taskIndex].comments[commentIndex] = {
      ...columnTasks[taskIndex].comments[commentIndex],
      ...commentData,
      updatedAt: dayjs().format('YYYY-MM-DDTHH:mm:ss'),
      updatedBy: commentData.userId || columnTasks[taskIndex].comments[commentIndex].updatedBy,
    };

    // Mettre à jour la tâche dans Firestore
    await updateDoc(boardRef, {
      [`board.tasks.${columnId}`]: columnTasks
    });

    // console.log('Comment updated successfully');
    return columnTasks[taskIndex].comments[commentIndex];
  } catch (error) {
    console.error('Error updating comment:', error);
    throw error;
  }
}

// ----------------------------------------------------------------------

export async function deleteComment(columnId, taskId, commentId) {
  try {
    const boardRef = doc(db, 'boards', 'main-board');

    // Récupérer les données actuelles du tableau
    const boardSnapshot = await getDoc(boardRef);
    const boardData = boardSnapshot.data();

    if (!boardData || !boardData.board || !boardData.board.tasks) {
      throw new Error('Invalid board structure');
    }

    // Trouver la tâche à mettre à jour
    const { tasks } = boardData.board;
    const columnTasks = tasks[columnId];
    const taskIndex = columnTasks.findIndex((task) => task.id === taskId);

    if (taskIndex === -1) {
      throw new Error(`Task with ID ${taskId} not found in column ${columnId}`);
    }

    // Filtrer le commentaire à supprimer
    columnTasks[taskIndex].comments = columnTasks[taskIndex].comments.filter(
      (comment) => comment.id !== commentId
    );

    // Mettre à jour la tâche dans Firestore
    await updateDoc(boardRef, {
      [`board.tasks.${columnId}`]: columnTasks
    });

    // console.log('Comment deleted successfully');
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
}

// À ajouter dans kanban.js après la fonction addComment

export async function replyToComment(columnId, taskId, commentId, replyData) {
  try {
    const boardRef = doc(db, 'boards', 'main-board');

    // Récupérer les données actuelles du tableau
    const boardSnapshot = await getDoc(boardRef);
    const boardData = boardSnapshot.data();

    if (!boardData || !boardData.board || !boardData.board.tasks) {
      throw new Error('Invalid board structure');
    }

    // Trouver la tâche à mettre à jour
    const { tasks } = boardData.board;
    const columnTasks = tasks[columnId];

    if (!Array.isArray(columnTasks)) {
      throw new Error(`No tasks array found for column ${columnId}`);
    }

    const taskIndex = columnTasks.findIndex((task) => task.id === taskId);

    if (taskIndex === -1) {
      throw new Error(`Task with ID ${taskId} not found in column ${columnId}`);
    }

    // Vérifier si les commentaires existent
    if (!columnTasks[taskIndex].comments) {
      throw new Error(`No comments found for task ${taskId}`);
    }

    // Trouver le commentaire parent
    const commentIndex = columnTasks[taskIndex].comments.findIndex(
      (comment) => comment.id === commentId
    );

    if (commentIndex === -1) {
      throw new Error(`Comment with ID ${commentId} not found`);
    }

    // Créer la nouvelle réponse
    const newReply = {
      id: crypto.randomUUID(),
      message: replyData.message,
      messageType: replyData.messageType || 'text',
      name: replyData.name,
      avatarUrl: replyData.avatarUrl,
      createdAt: dayjs().format('YYYY-MM-DDTHH:mm:ss'),
      updatedAt: dayjs().format('YYYY-MM-DDTHH:mm:ss'),
      createdBy: replyData.createdBy,
      updatedBy: replyData.updatedBy,
      email: replyData.email,
      role: replyData.role,
      roleLevel: replyData.roleLevel,
      parentId: commentId,
      mentions: replyData.mentions || [],
      replyTo: {
        id: commentId,
        message: columnTasks[taskIndex].comments[commentIndex].message,
        name: columnTasks[taskIndex].comments[commentIndex].name,
        avatarUrl: columnTasks[taskIndex].comments[commentIndex].avatarUrl,
      }
    };

    // Ajouter la réponse dans le tableau principal des commentaires
    columnTasks[taskIndex].comments.unshift(newReply);

    // Mettre à jour la tâche dans Firestore
    const updateData = {
      [`board.tasks.${columnId}`]: columnTasks
    };

    await updateDoc(boardRef, updateData);

    // console.log('New reply added successfully');
    return newReply;
  } catch (error) {
    console.error('Error adding reply:', error);
    throw error;
  }
}

// ----------------------------------------------------------------------

export async function uploadCommentFile(columnId, taskId, file, userId) {
  try {
    const boardRef = doc(db, 'boards', 'main-board');
    const fileExtension = file.name.split('.').pop().toLowerCase();
    const fileName = `${crypto.randomUUID()}.${fileExtension}`;
    const filePath = `comments/${columnId}/${taskId}/${fileName}`;
    const storageRef = ref(storage, filePath);

    // Upload file to Firebase Storage
    await uploadBytes(storageRef, file);

    // Get download URL
    const downloadURL = await getDownloadURL(storageRef);

    // Create comment data
    const commentData = {
      id: crypto.randomUUID(),
      message: downloadURL,
      messageType: 'file',
      fileName: file.name,
      fileExtension,
      fileSize: file.size,
      filePath,
      name: userId?.displayName || `${userId?.firstName} ${userId?.lastName}`,
      avatarUrl: userId?.avatarUrl || '',
      createdAt: dayjs().format('YYYY-MM-DDTHH:mm:ss'),
      updatedAt: dayjs().format('YYYY-MM-DDTHH:mm:ss'),
      createdBy: userId?.id,
      updatedBy: userId?.id,
      email: userId?.email,
      role: userId?.role,
      roleLevel: userId?.roleLevel,
    };

    // Add comment to task
    const boardSnapshot = await getDoc(boardRef);
    const boardData = boardSnapshot.data();

    if (!boardData || !boardData.board || !boardData.board.tasks) {
      throw new Error('Invalid board structure');
    }

    const { tasks } = boardData.board;
    const columnTasks = tasks[columnId];
    const taskIndex = columnTasks.findIndex((task) => task.id === taskId);

    if (taskIndex === -1) {
      throw new Error(`Task with ID ${taskId} not found in column ${columnId}`);
    }

    if (!columnTasks[taskIndex].comments) {
      columnTasks[taskIndex].comments = [];
    }

    columnTasks[taskIndex].comments.unshift(commentData);

    await updateDoc(boardRef, {
      [`board.tasks.${columnId}`]: columnTasks
    });

    return commentData;
  } catch (error) {
    console.error('Error uploading comment file:', error);
    throw error;
  }
}

// ----------------------------------------------------------------------

export async function deleteCommentFile(columnId, taskId, commentId, filePath) {
  try {
    // Delete file from Storage
    if (filePath) {
      const storageRef = ref(storage, filePath);
      await deleteObject(storageRef);
    }

    // Delete comment from task
    const boardRef = doc(db, 'boards', 'main-board');
    const boardSnapshot = await getDoc(boardRef);
    const boardData = boardSnapshot.data();

    if (!boardData || !boardData.board || !boardData.board.tasks) {
      throw new Error('Invalid board structure');
    }

    const { tasks } = boardData.board;
    const columnTasks = tasks[columnId];
    const taskIndex = columnTasks.findIndex((task) => task.id === taskId);

    if (taskIndex === -1) {
      throw new Error(`Task with ID ${taskId} not found in column ${columnId}`);
    }

    columnTasks[taskIndex].comments = columnTasks[taskIndex].comments.filter(
      (comment) => comment.id !== commentId
    );

    await updateDoc(boardRef, {
      [`board.tasks.${columnId}`]: columnTasks
    });

    // console.log('Comment file deleted successfully');
  } catch (error) {
    console.error('Error deleting comment file:', error);
    throw error;
  }
}

// ----------------------------------------------------------------------

export async function deleteTaskCommentFiles(columnId, taskId) {
  try {
    const boardRef = doc(db, 'boards', 'main-board');
    const boardSnapshot = await getDoc(boardRef);
    const boardData = boardSnapshot.data();

    if (!boardData || !boardData.board || !boardData.board.tasks) {
      throw new Error('Invalid board structure');
    }

    const { tasks } = boardData.board;
    const columnTasks = tasks[columnId];
    const taskIndex = columnTasks.findIndex((task) => task.id === taskId);

    if (taskIndex === -1) {
      throw new Error(`Task with ID ${taskId} not found in column ${columnId}`);
    }

    const task = columnTasks[taskIndex];
    if (!task.comments) return;

    // Delete all files from Storage
    const deletePromises = task.comments
      .filter(comment => comment.messageType === 'file' && comment.filePath)
      .map(async (comment) => {
        const storageRef = ref(storage, comment.filePath);
        try {
          await deleteObject(storageRef);
        } catch (error) {
          console.warn(`Error deleting file ${comment.filePath}:`, error);
        }
      });

    await Promise.all(deletePromises);
    // console.log('All task comment files deleted successfully');
  } catch (error) {
    console.error('Error deleting task comment files:', error);
    throw error;
  }
}
