import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

export function DeleteDialog({
  open,
  handleClose,
  handleConfirm,
  title,
  subtitle
}) {
  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        {subtitle}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Annuler</Button>
        <Button onClick={handleConfirm} color="error" variant="contained">
          Supprimer
        </Button>
      </DialogActions>
    </Dialog>
  );
}
