import { toast } from 'sonner';
import { useState, useEffect, useCallback } from 'react';
import {
  ref,
  listAll,
  getMetadata,
  uploadBytes,
  deleteObject,
  getDownloadURL,
} from 'firebase/storage';

import {
  Box,
  Card,
  List,
  Button,
  Divider,
  Tooltip,
  ListItem,
  Checkbox,
  CardHeader,
  IconButton,
  Typography,
  CardContent,
  ListItemText,
  LinearProgress,
  CircularProgress,
  FormControlLabel,
  ListItemSecondaryAction,
} from '@mui/material';

import { formatDate, getFileIcon, formatFileSize } from 'src/utils/storage-utils';

import { Iconify } from 'src/components/iconify';

import { NewFolderDialog, DeleteConfirmDialog, DownloadOptionsDialog } from './storage-dialogs';

export default function StorageExplorer({ storage }) {
  const [currentPath, setCurrentPath] = useState('');
  const [items, setItems] = useState({ folders: [], files: [] });
  const [loadingStorage, setLoadingStorage] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({ active: false, current: 0, total: 0 });
  const [downloadOptionsOpen, setDownloadOptionsOpen] = useState(false);
  const [downloadOption, setDownloadOption] = useState('individual');
  const [customFolderName, setCustomFolderName] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [openNewFolderDialog, setOpenNewFolderDialog] = useState(false);
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Utiliser useCallback pour mémoriser la fonction listStorageFiles
  const listStorageFiles = useCallback(
    async (path) => {
      setLoadingStorage(true);
      setCurrentPath(path);
      setSelectedItems([]);
      setSelectAll(false);

      try {
        const storageRef = ref(storage, path);
        const result = await listAll(storageRef);

        const folders = [];
        const files = [];

        // Traiter les dossiers
        result.prefixes.forEach((prefixItem) => {
          folders.push({
            name: prefixItem.name,
            fullPath: prefixItem.fullPath,
          });
        });

        // Traiter les fichiers avec leurs métadonnées
        // Utiliser Promise.all pour éviter les await dans les boucles
        await Promise.all(
          result.items.map(async (itemRef) => {
            try {
              const metadata = await getMetadata(itemRef);
              const url = await getDownloadURL(itemRef);

              files.push({
                name: itemRef.name,
                fullPath: itemRef.fullPath,
                contentType: metadata.contentType,
                size: metadata.size,
                timeCreated: metadata.timeCreated,
                updated: metadata.updated,
                url,
              });
            } catch (error) {
              console.error(
                `Erreur lors de la récupération des métadonnées pour ${itemRef.fullPath}:`,
                error
              );
              files.push({
                name: itemRef.name,
                fullPath: itemRef.fullPath,
                error: true,
              });
            }
          })
        );

        // Mettre à jour l'état avec les dossiers et fichiers séparés
        setItems({
          folders,
          files,
        });

        toast.success('Fichiers chargés avec succès');
      } catch (error) {
        console.error('Erreur lors de la récupération des fichiers:', error);
        toast.error(`Erreur: ${error.message}`);
        setItems({ folders: [], files: [] });
      } finally {
        setLoadingStorage(false);
      }
    },
    [storage]
  );

  // Charger les fichiers au premier rendu ou quand listStorageFiles change
  useEffect(() => {
    if (items.folders.length === 0 && items.files.length === 0) {
      listStorageFiles('');
    }
  }, [items.folders.length, items.files.length, listStorageFiles]);

  const handleNavigateFolder = (path) => {
    listStorageFiles(path);
  };

  const handleNavigateUp = () => {
    if (currentPath === '') return;

    const pathParts = currentPath.split('/');
    pathParts.pop();
    const newPath = pathParts.join('/');
    listStorageFiles(newPath);
  };

  const createFolder = async () => {
    if (!newFolderName) return;

    const placeholderPath = `${currentPath}${currentPath ? '/' : ''}${newFolderName}/.placeholder`;
    const placeholderRef = ref(storage, placeholderPath);

    try {
      await uploadBytes(placeholderRef, new Uint8Array(0));
      setNewFolderName('');
      setOpenNewFolderDialog(false);
      listStorageFiles(currentPath);
      toast.success('Dossier créé avec succès');
    } catch (error) {
      console.error('Erreur lors de la création du dossier:', error);
      toast.error(`Erreur: ${error.message}`);
    }
  };

  const uploadFiles = async (event) => {
    const { files } = event.target;
    if (!files || files.length === 0) return;

    setLoadingStorage(true);
    try {
      await Promise.all(
        Array.from(files).map(async (file) => {
          const filePath = `${currentPath}${currentPath ? '/' : ''}${file.name}`;
          const fileRef = ref(storage, filePath);
          await uploadBytes(fileRef, file);
        })
      );
      listStorageFiles(currentPath);
      toast.success('Fichiers téléchargés avec succès');
    } catch (error) {
      console.error("Erreur lors de l'upload:", error);
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setLoadingStorage(false);
    }
  };

  // Ouvrir le dialogue de confirmation de suppression
  const handleDeleteClick = (path, isFolder) => {
    setItemToDelete({ path, isFolder });
    setDeleteConfirmDialog(true);
  };

  // Confirmer et exécuter la suppression
  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    setLoadingStorage(true);
    try {
      if (itemToDelete.isFolder) {
        // Fonction récursive pour supprimer les dossiers
        const deleteFolder = async (folderPath) => {
          const folderRef = ref(storage, folderPath);
          const result = await listAll(folderRef);

          // Supprimer tous les fichiers dans ce dossier
          await Promise.all(result.items.map((itemRef) => deleteObject(itemRef)));

          // Récursivement supprimer tous les sous-dossiers
          await Promise.all(result.prefixes.map((prefix) => deleteFolder(prefix.fullPath)));
        };

        await deleteFolder(itemToDelete.path);
      } else {
        // Supprimer un fichier
        const fileRef = ref(storage, itemToDelete.path);
        await deleteObject(fileRef);
      }

      setDeleteConfirmDialog(false);
      setItemToDelete(null);
      listStorageFiles(currentPath);
      toast.success(`${itemToDelete.isFolder ? 'Dossier' : 'Fichier'} supprimé avec succès`);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setLoadingStorage(false);
    }
  };

  const handleDownloadFile = async (path) => {
    const fileItem = items.files.find((f) => f.fullPath === path);
    if (fileItem && fileItem.url) {
      // Utiliser directement l'URL déjà chargée
      const a = document.createElement('a');
      a.href = fileItem.url;
      a.download = fileItem.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success('Téléchargement démarré');
    } else {
      // Fallback au cas où l'URL n'est pas disponible
      try {
        const fileRef = ref(storage, path);
        const url = await getDownloadURL(fileRef);
        const fileName = path.split('/').pop();

        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        toast.success('Téléchargement démarré');
      } catch (error) {
        console.error('Erreur lors du téléchargement du fichier:', error);
        toast.error(`Erreur: ${error.message}`);
      }
    }
  };

  const handleOpenFile = (path) => {
    const fileItem = items.files.find((f) => f.fullPath === path);
    if (fileItem && fileItem.url) {
      window.open(fileItem.url, '_blank');
      toast.success('Fichier ouvert dans un nouvel onglet');
    } else {
      // Fallback
      getDownloadURL(ref(storage, path))
        .then((url) => {
          window.open(url, '_blank');
          toast.success('Fichier ouvert dans un nouvel onglet');
        })
        .catch((error) => {
          console.error("Erreur lors de l'ouverture du fichier:", error);
          toast.error(`Erreur: ${error.message}`);
        });
    }
  };

  const handleSelectItem = (path) => {
    setSelectedItems((prev) => {
      if (prev.includes(path)) {
        return prev.filter((item) => item !== path);
      }
      return [...prev, path];
    });
  };

  const handleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);

    if (newSelectAll) {
      // Sélectionner tous les fichiers (pas les dossiers)
      const filePaths = items.files.map((file) => file.fullPath);
      setSelectedItems(filePaths);
    } else {
      // Désélectionner tout
      setSelectedItems([]);
    }
  };

  const openDownloadOptions = () => {
    if (selectedItems.length === 0) {
      toast.error('Veuillez sélectionner au moins un fichier');
      return;
    }
    setDownloadOptionsOpen(true);
  };

  const closeDownloadOptions = () => {
    setDownloadOptionsOpen(false);
  };

  const startDownload = () => {
    closeDownloadOptions();

    if (downloadOption === 'individual') {
      handleBulkDownloadIndividual();
    } else if (downloadOption === 'preserve_structure') {
      handleBulkDownloadPreserveStructure();
    } else if (downloadOption === 'custom_folder') {
      handleBulkDownloadCustomFolder();
    }
  };

  const handleBulkDownloadIndividual = async () => {
    // Initialiser la progression
    setDownloadProgress({
      active: true,
      current: 0,
      total: selectedItems.length,
    });

    try {
      // Utiliser une approche séquentielle avec reduce pour éviter les await dans les boucles
      await selectedItems.reduce(async (previousPromise, path, index) => {
        await previousPromise;

        const fileRef = ref(storage, path);
        try {
          // Obtenir l'URL de téléchargement
          const url = await getDownloadURL(fileRef);

          // Créer un lien invisible et déclencher le téléchargement
          const a = document.createElement('a');
          a.href = url;
          a.download = path.split('/').pop(); // Utiliser le nom du fichier
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);

          // Mettre à jour la progression
          setDownloadProgress((prev) => ({
            ...prev,
            current: index + 1,
          }));

          // Petite pause pour éviter de surcharger le navigateur
          await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`Erreur lors du téléchargement de ${path}:`, error);
          // Continuer avec les autres fichiers
          setDownloadProgress((prev) => ({
            ...prev,
            current: index + 1,
          }));
        }
      }, Promise.resolve());

      toast.success('Téléchargement groupé terminé');
    } catch (error) {
      console.error('Erreur lors du téléchargement groupé:', error);
      toast.error(`Erreur: ${error.message}`);
    } finally {
      // Réinitialiser la progression
      setDownloadProgress({
        active: false,
        current: 0,
        total: 0,
      });
    }
  };

  const handleBulkDownloadPreserveStructure = async () => {
    // Créer un fichier texte avec les liens de téléchargement et la structure des dossiers
    setDownloadProgress({
      active: true,
      current: 0,
      total: selectedItems.length,
    });

    try {
      let fileContent = '# Liens de téléchargement avec structure de dossiers\n\n';
      fileContent +=
        'Pour préserver la structure des dossiers, créez les dossiers indiqués et téléchargez les fichiers aux emplacements correspondants.\n\n';

      // Utiliser une approche séquentielle avec reduce pour éviter les await dans les boucles
      await selectedItems.reduce(async (previousPromise, path, index) => {
        await previousPromise;

        const fileRef = ref(storage, path);
        try {
          // Obtenir l'URL de téléchargement
          const url = await getDownloadURL(fileRef);

          // Extraire le chemin relatif (sans le nom du fichier)
          const pathParts = path.split('/');
          const fileName = pathParts.pop();
          const folderPath = pathParts.join('/');

          fileContent += `## Fichier: ${fileName}\n`;
          fileContent += `Dossier: ${folderPath}\n`;
          fileContent += `URL: ${url}\n\n`;

          // Mettre à jour la progression
          setDownloadProgress((prev) => ({
            ...prev,
            current: index + 1,
          }));
        } catch (error) {
          console.error(`Erreur lors de la récupération de l'URL pour ${path}:`, error);
          fileContent += `## Fichier: ${path}\n`;
          fileContent += `Erreur: Impossible de récupérer l'URL\n\n`;

          // Mettre à jour la progression même en cas d'erreur
          setDownloadProgress((prev) => ({
            ...prev,
            current: index + 1,
          }));
        }
      }, Promise.resolve());

      // Télécharger le fichier texte
      const blob = new Blob([fileContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `structure-fichiers-${new Date().toISOString().slice(0, 10)}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Fichier de structure généré avec succès');
    } catch (error) {
      console.error('Erreur lors de la génération du fichier de structure:', error);
      toast.error(`Erreur: ${error.message}`);
    } finally {
      // Réinitialiser la progression
      setDownloadProgress({
        active: false,
        current: 0,
        total: 0,
      });
    }
  };

  const handleBulkDownloadCustomFolder = async () => {
    if (!customFolderName.trim()) {
      toast.error('Veuillez spécifier un nom de dossier');
      return;
    }

    // Initialiser la progression
    setDownloadProgress({
      active: true,
      current: 0,
      total: selectedItems.length,
    });

    try {
      // Créer un fichier texte avec les instructions
      let fileContent = `# Fichiers à placer dans le dossier: ${customFolderName}\n\n`;
      fileContent += 'Voici les liens de téléchargement pour tous les fichiers sélectionnés:\n\n';

      // Utiliser une approche séquentielle avec reduce pour éviter les await dans les boucles
      await selectedItems.reduce(async (previousPromise, path, index) => {
        await previousPromise;

        const fileRef = ref(storage, path);
        try {
          // Obtenir l'URL de téléchargement
          const url = await getDownloadURL(fileRef);

          // Extraire le nom du fichier
          const fileName = path.split('/').pop();

          fileContent += `## ${fileName}\n`;
          fileContent += `URL: ${url}\n\n`;

          // Télécharger le fichier avec le préfixe du dossier personnalisé
          const a = document.createElement('a');
          a.href = url;
          a.download = `${customFolderName}_${fileName}`;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);

          // Mettre à jour la progression
          setDownloadProgress((prev) => ({
            ...prev,
            current: index + 1,
          }));

          // Petite pause pour éviter de surcharger le navigateur
          await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`Erreur lors du téléchargement de ${path}:`, error);
          fileContent += `## ${path.split('/').pop()}\n`;
          fileContent += `Erreur: Impossible de télécharger\n\n`;

          // Mettre à jour la progression même en cas d'erreur
          setDownloadProgress((prev) => ({
            ...prev,
            current: index + 1,
          }));
        }
      }, Promise.resolve());

      // Télécharger le fichier texte avec les instructions
      const blob = new Blob([fileContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${customFolderName}-instructions.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Téléchargement groupé terminé');
    } catch (error) {
      console.error('Erreur lors du téléchargement groupé:', error);
      toast.error(`Erreur: ${error.message}`);
    } finally {
      // Réinitialiser la progression
      setDownloadProgress({
        active: false,
        current: 0,
        total: 0,
      });
    }
  };

  return (
    <>
      <Card>
        <CardHeader
          title="Fichiers Storage"
          subheader={currentPath || 'Dossier racine'}
          action={
            <Box sx={{ display: 'flex', gap: 1 }}>
              {currentPath && (
                <Button
                  startIcon={<Iconify icon="eva:arrow-up-outline" />}
                  onClick={handleNavigateUp}
                >
                  Dossier parent
                </Button>
              )}
              <Button
                variant="contained"
                color="success"
                startIcon={<Iconify icon="eva:upload-outline" />}
                component="label"
                disabled={loadingStorage}
              >
                Télécharger des fichiers
                <input type="file" multiple hidden onChange={uploadFiles} />
              </Button>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<Iconify icon="eva:folder-add-outline" />}
                onClick={() => setOpenNewFolderDialog(true)}
                disabled={loadingStorage}
              >
                Nouveau dossier
              </Button>
              {selectedItems.length > 0 && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<Iconify icon="eva:download-outline" />}
                  onClick={openDownloadOptions}
                  disabled={downloadProgress.active}
                >
                  Télécharger ({selectedItems.length})
                </Button>
              )}
            </Box>
          }
        />
        <CardContent>
          {downloadProgress.active && (
            <Box sx={{ width: '100%', mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Téléchargement en cours...</Typography>
                <Typography variant="body2">
                  {downloadProgress.current} / {downloadProgress.total}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={(downloadProgress.current / downloadProgress.total) * 100}
              />
            </Box>
          )}

          {loadingStorage ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {items.files.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <FormControlLabel
                    control={
                      <Checkbox checked={selectAll} onChange={handleSelectAll} color="primary" />
                    }
                    label="Sélectionner tous les fichiers"
                  />
                </Box>
              )}

              <List>
                {items.folders.length === 0 && items.files.length === 0 ? (
                  <Typography variant="body2" sx={{ p: 2, textAlign: 'center' }}>
                    Aucun fichier trouvé dans ce dossier
                  </Typography>
                ) : (
                  <>
                    {/* Afficher d'abord les dossiers */}
                    {items.folders.map((folder, index) => (
                      <Box key={`folder-${folder.fullPath}`}>
                        <ListItem button onClick={() => handleNavigateFolder(folder.fullPath)}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mr: 2, ml: 4 }}>
                            <Iconify
                              icon="eva:folder-outline"
                              width={24}
                              height={24}
                              color="primary.main"
                            />
                          </Box>
                          <ListItemText primary={folder.name} />
                          <ListItemSecondaryAction>
                            <Tooltip title="Supprimer le dossier">
                              <IconButton
                                edge="end"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteClick(folder.fullPath, true);
                                }}
                              >
                                <Iconify icon="eva:trash-2-outline" width={24} height={24} />
                              </IconButton>
                            </Tooltip>
                          </ListItemSecondaryAction>
                        </ListItem>
                        {index < items.folders.length - 1 && <Divider />}
                      </Box>
                    ))}

                    {/* Divider entre dossiers et fichiers si les deux sont présents */}
                    {items.folders.length > 0 && items.files.length > 0 && (
                      <Divider sx={{ my: 1 }} />
                    )}

                    {/* Afficher ensuite les fichiers */}
                    {items.files.map((file, index) => (
                      <Box key={`file-${file.fullPath}`}>
                        <ListItem>
                          <Checkbox
                            edge="start"
                            checked={selectedItems.includes(file.fullPath)}
                            onChange={() => handleSelectItem(file.fullPath)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                            <Iconify icon={getFileIcon(file.contentType)} width={24} height={24} />
                          </Box>
                          <ListItemText
                            primary={file.name}
                            secondary={
                              !file.error ? (
                                <>
                                  {file.contentType} • {formatFileSize(file.size)}
                                  <br />
                                  Créé le: {formatDate(file.timeCreated)}
                                  <br />
                                  {file.url && (
                                    <a
                                      href={file.url}
                                      download={file.name}
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      Télécharger directement
                                    </a>
                                  )}
                                </>
                              ) : (
                                'Erreur lors du chargement des métadonnées'
                              )
                            }
                          />
                          <ListItemSecondaryAction>
                            <Box sx={{ display: 'flex' }}>
                              <Tooltip title="Télécharger en local">
                                <IconButton
                                  edge="end"
                                  onClick={() => handleDownloadFile(file.fullPath)}
                                >
                                  <Iconify icon="eva:download-outline" width={24} height={24} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Ouvrir dans un nouvel onglet">
                                <IconButton
                                  edge="end"
                                  onClick={() => handleOpenFile(file.fullPath)}
                                >
                                  <Iconify
                                    icon="eva:external-link-outline"
                                    width={24}
                                    height={24}
                                  />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Supprimer">
                                <IconButton
                                  edge="end"
                                  onClick={() => handleDeleteClick(file.fullPath, false)}
                                >
                                  <Iconify icon="eva:trash-2-outline" width={24} height={24} />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </ListItemSecondaryAction>
                        </ListItem>
                        {index < items.files.length - 1 && <Divider />}
                      </Box>
                    ))}
                  </>
                )}
              </List>
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialogues */}
      <NewFolderDialog
        open={openNewFolderDialog}
        onClose={() => setOpenNewFolderDialog(false)}
        folderName={newFolderName}
        setFolderName={setNewFolderName}
        onCreateFolder={createFolder}
      />

      <DeleteConfirmDialog
        open={deleteConfirmDialog}
        onClose={() => setDeleteConfirmDialog(false)}
        itemToDelete={itemToDelete}
        onConfirmDelete={handleDeleteConfirm}
      />

      <DownloadOptionsDialog
        open={downloadOptionsOpen}
        onClose={closeDownloadOptions}
        downloadOption={downloadOption}
        setDownloadOption={setDownloadOption}
        customFolderName={customFolderName}
        setCustomFolderName={setCustomFolderName}
        onStartDownload={startDownload}
      />
    </>
  );
}
