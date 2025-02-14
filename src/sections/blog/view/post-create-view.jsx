import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { PostNewEditForm } from '../post-new-edit-form';

// ----------------------------------------------------------------------

export function PostCreateView({ categories }) {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Créer un nouvel article"
        links={[
          { name: 'Tableau de bord', href: paths.dashboard.root },
          { name: 'Blog', href: paths.dashboard.post.root },
          { name: 'Créer' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <PostNewEditForm categories={categories} />
    </DashboardContent>
  );
}
