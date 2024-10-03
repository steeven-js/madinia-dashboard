import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import LoadingButton from '@mui/lab/LoadingButton';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { PasswordIcon } from 'src/assets/icons';

import { Form, Field } from 'src/components/hook-form';

import { FormHead } from '../../components/form-head';
import { sendPasswordResetEmail } from '../../context/firebase';
import { FormReturnLink } from '../../components/form-return-link';

// ----------------------------------------------------------------------

export const ResetPasswordSchema = zod.object({
  email: zod
    .string()
    .min(1, { message: "L'email est requis !" })
    .email({ message: "L'email doit être une adresse email valide !" }),
});

// ----------------------------------------------------------------------

export function FirebaseResetPasswordView() {
  const router = useRouter();

  const defaultValues = {
    email: '',
  };

  const methods = useForm({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      await sendPasswordResetEmail({ email: data.email });

      const searchParams = new URLSearchParams({ email: data.email }).toString();

      const href = `${paths.auth.firebase.verify}?${searchParams}`;
      router.push(href);
    } catch (error) {
      console.error(error);
    }
  });

  const renderForm = (
    <Box gap={3} display="flex" flexDirection="column">
      <Field.Text
        autoFocus
        name="email"
        label="Adresse email"
        placeholder="exemple@gmail.com"
        InputLabelProps={{ shrink: true }}
      />

      <LoadingButton
        fullWidth
        size="large"
        type="submit"
        variant="contained"
        loading={isSubmitting}
        loadingIndicator="Envoi de la demande..."
      >
        Envoyer la demande
      </LoadingButton>
    </Box>
  );

  return (
    <>
      <FormHead
        icon={<PasswordIcon />}
        title="Mot de passe oublié ?"
        description={`Veuillez entrer l'adresse email associée à votre compte et nous vous enverrons un lien pour réinitialiser votre mot de passe.`}
      />

      <Form methods={methods} onSubmit={onSubmit}>
        {renderForm}
      </Form>

      <FormReturnLink href={paths.auth.firebase.signIn} />
    </>
  );
}
