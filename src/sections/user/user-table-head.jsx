export const TABLE_HEAD = [
  { id: 'name', label: 'Utilisateur', align: 'left', width: 280 },
  { id: 'phone', label: 'Téléphone', align: 'left', width: 180 },
  { id: 'role', label: 'Rôle', align: 'left', width: 180 },
  { id: 'status', label: 'Statut', align: 'left', width: 180 },
  { id: 'actions', label: 'Actions', align: 'right', width: 100 },
];

export default function UserTableHead({
  order,
  orderBy,
  rowCount,
  headLabel,
  numSelected,
  onRequestSort,
  onSelectAllClick,
  sx,
}) {
  // ... reste du composant ...
}
