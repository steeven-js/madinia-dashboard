import { v4 as uuidv4 } from 'uuid';
import { useSelector } from 'react-redux';
import { useMemo, useState, useEffect } from 'react';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  onSnapshot,
  getFirestore,
} from 'firebase/firestore';

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

    // S'assurer que toutes les valeurs sont définies
    const newTask = {
      id: taskData.id || crypto.randomUUID(),
      status: taskData.status || 'Untitled',
      name: taskData.name || 'Untitled',
      priority: taskData.priority || 'medium',
      attachments: taskData.attachments || [],
      labels: taskData.labels || [],
      comments: taskData.comments || [],
      assignee: taskData.assignee || [],
      due: taskData.due || [new Date().toISOString(), new Date(Date.now() + 86400000).toISOString()],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: userId || null,
      updatedBy: userId || null,
      reporter: {
        id: userId || null,
        name: taskData.reporter?.name || 'Anonymous',
        avatarUrl: taskData.reporter?.avatarUrl || null,
        email: taskData.reporter?.email || null,
        role: taskData.reporter?.role || null,
        roleLevel: taskData.reporter?.roleLevel || 0,
        isVerified: taskData.reporter?.isVerified || false,
      },
      description: taskData.description || '',
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

    // Trouver l'index de la tâche à mettre à jour
    const { tasks } = boardData.board;
    const columnTasks = tasks[columnId];
    const taskIndex = columnTasks.findIndex((task) => task.id === taskData.id);

    if (taskIndex === -1) {
      throw new Error(`Task with ID ${taskData.id} not found in column ${columnId}`);
    }

    // Mettre à jour les données de la tâche avec le timestamp et l'utilisateur
    const updatedTask = {
      ...columnTasks[taskIndex],
      ...taskData,
      updatedAt: new Date().toISOString(),
      updatedBy: taskData.updatedBy || columnTasks[taskIndex].updatedBy,
      reporter: {
        ...columnTasks[taskIndex].reporter,
        ...taskData.reporter,
      },
    };

    columnTasks[taskIndex] = updatedTask;

    // Utiliser setDoc avec merge: true pour mettre à jour uniquement les champs spécifiés
    await setDoc(
      boardRef,
      {
        board: {
          tasks: {
            [columnId]: columnTasks,
          },
        },
      },
      { merge: true }
    );

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
  // Supprime une tâche de la colonne spécifiée

  try {
    const boardRef = doc(db, 'boards', 'main-board');

    // Récupérer les données actuelles du tableau
    const boardSnapshot = await getDoc(boardRef);
    const boardData = boardSnapshot.data();

    if (!boardData || !boardData.board || !boardData.board.tasks) {
      throw new Error('Invalid board structure');
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
