import {
  Radio,
  Dialog,
  Button,
  TextField,
  FormLabel,
  Typography,
  RadioGroup,
  DialogTitle,
  FormControl,
  DialogContent,
  DialogActions,
  InputAdornment,
  FormControlLabel,
} from '@mui/material';

import { Iconify } from 'src/components/iconify';

export function NewFolderDialog({ open, onClose, folderName, setFolderName, onCreateFolder }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Créer un nouveau dossier</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          label="Nom du dossier"
          value={folderName}
          onChange={(e) => setFolderName(e.target.value)}
          margin="normal"
          placeholder="nouveau-dossier"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="eva:folder-outline" />
              </InputAdornment>
            ),
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button onClick={onCreateFolder} variant="contained" disabled={!folderName.trim()}>
          Créer
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function DeleteConfirmDialog({ open, onClose, itemToDelete, onConfirmDelete }) {
  if (!itemToDelete) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm">
      <DialogTitle>Confirmer la suppression</DialogTitle>
      <DialogContent>
        <Typography>
          Êtes-vous sûr de vouloir supprimer {itemToDelete.isFolder ? 'le dossier' : 'le fichier'}{' '}
          {itemToDelete.path.split('/').pop()} ?
          {itemToDelete.isFolder && (
            <Typography color="error" sx={{ mt: 1 }}>
              Attention : Tous les fichiers et sous-dossiers seront également supprimés.
            </Typography>
          )}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button onClick={onConfirmDelete} variant="contained" color="error">
          Supprimer
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function DownloadOptionsDialog({
  open,
  onClose,
  downloadOption,
  setDownloadOption,
  customFolderName,
  setCustomFolderName,
  onStartDownload,
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Options de téléchargement</DialogTitle>
      <DialogContent>
        <FormControl component="fieldset" sx={{ mt: 1 }}>
          <FormLabel component="legend">Choisissez comment télécharger les fichiers</FormLabel>
          <RadioGroup value={downloadOption} onChange={(e) => setDownloadOption(e.target.value)}>
            <FormControlLabel
              value="individual"
              control={<Radio />}
              label="Télécharger les fichiers individuellement"
            />
            <FormControlLabel
              value="preserve_structure"
              control={<Radio />}
              label="Préserver la structure des dossiers (génère un fichier d'instructions)"
            />
            <FormControlLabel
              value="custom_folder"
              control={<Radio />}
              label="Spécifier un dossier personnalisé"
            />
          </RadioGroup>
        </FormControl>

        {downloadOption === 'custom_folder' && (
          <TextField
            fullWidth
            label="Nom du dossier"
            value={customFolderName}
            onChange={(e) => setCustomFolderName(e.target.value)}
            margin="normal"
            placeholder="mon-dossier"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="eva:folder-outline" />
                </InputAdornment>
              ),
            }}
            helperText="Les fichiers seront préfixés avec ce nom de dossier"
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button
          onClick={onStartDownload}
          variant="contained"
          disabled={downloadOption === 'custom_folder' && !customFolderName.trim()}
        >
          Télécharger
        </Button>
      </DialogActions>
    </Dialog>
  );
}
