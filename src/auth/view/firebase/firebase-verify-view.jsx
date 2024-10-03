import { paths } from 'src/routes/paths';

import { EmailInboxIcon } from 'src/assets/icons';

import { FormHead } from '../../components/form-head';
import { FormReturnLink } from '../../components/form-return-link';

// ----------------------------------------------------------------------

export function FirebaseVerifyView() {
  return (
    <>
      <FormHead
        icon={<EmailInboxIcon />}
        title="Veuillez vérifier votre email !"
        description={`Nous vous avons envoyé un code de confirmation à 6 chiffres par email. \nVeuillez entrer le code dans la case ci-dessous pour vérifier votre email.`}
      />

      <FormReturnLink href={paths.auth.firebase.signIn} sx={{ mt: 0 }} />
    </>
  );
}
