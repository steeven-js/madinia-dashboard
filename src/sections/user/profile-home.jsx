import { useRef } from 'react';

// import Fab from '@mui/material/Fab';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
// import Button from '@mui/material/Button';
// import Divider from '@mui/material/Divider';
// import InputBase from '@mui/material/InputBase';
import Grid from '@mui/material/Unstable_Grid2';
import CardHeader from '@mui/material/CardHeader';

// import { fNumber } from 'src/utils/format-number';

// import { ProfilePostItem } from './profile-post-item';
import { Typography } from '@mui/material';

// import { varAlpha } from 'src/theme/styles';
import { TwitterIcon, FacebookIcon, LinkedinIcon, InstagramIcon } from 'src/assets/icons';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function ProfileHome({ info }) {
  const fileRef = useRef(null);

  // const handleAttach = () => {
  //   if (fileRef.current) {
  //     fileRef.current.click();
  //   }
  // };

  // const renderFollows = (
  //   <Card sx={{ py: 3, textAlign: 'center', typography: 'h4' }}>
  //     <Stack
  //       direction="row"
  //       divider={<Divider orientation="vertical" flexItem sx={{ borderStyle: 'dashed' }} />}
  //     >
  //       <Stack width={1}>
  //         {fNumber(info.totalFollowers)}
  //         <Box component="span" sx={{ color: 'text.secondary', typography: 'body2' }}>
  //           Follower
  //         </Box>
  //       </Stack>

  //       <Stack width={1}>
  //         {fNumber(info.totalFollowing)}
  //         <Box component="span" sx={{ color: 'text.secondary', typography: 'body2' }}>
  //           Following
  //         </Box>
  //       </Stack>
  //     </Stack>
  //   </Card>
  // );

  const renderAbout = (
    <Card>
      <CardHeader title="À propos" />

      <Stack spacing={2} sx={{ p: 3, typography: 'body2' }}>
        <Box>{info.about}</Box>

        <Box display="flex">
          <Iconify width={24} icon="mingcute:location-fill" sx={{ mr: 2 }} />
          Habite à
          <Link variant="subtitle2" color="inherit">
            &nbsp;{info.city}, {info.country}
          </Link>
        </Box>

        <Box display="flex">
          <Iconify width={24} icon="fluent:mail-24-filled" sx={{ mr: 2 }} />
          {info.email}
        </Box>

        <Box display="flex">
          <Iconify width={24} icon="ic:round-business-center" sx={{ mr: 2 }} />
          {info.role} {`chez `}
          <Link variant="subtitle2" color="inherit">
            &nbsp;{info.company}
          </Link>
        </Box>

        <Box display="flex">
          <Iconify width={24} icon="solar:phone-bold" sx={{ mr: 2 }} />
          {info.phoneNumber}
        </Box>
      </Stack>
    </Card>
  );

  // const renderPostInput = (
  //   <Card sx={{ p: 3 }}>
  //     <InputBase
  //       multiline
  //       fullWidth
  //       rows={4}
  //       placeholder="Share what you are thinking here..."
  //       sx={{
  //         p: 2,
  //         mb: 3,
  //         borderRadius: 1,
  //         border: (theme) => `solid 1px ${varAlpha(theme.vars.palette.grey['500Channel'], 0.2)}`,
  //       }}
  //     />

  //     <Stack direction="row" alignItems="center" justifyContent="space-between">
  //       <Stack direction="row" spacing={1} alignItems="center" sx={{ color: 'text.secondary' }}>
  //         <Fab size="small" color="inherit" variant="softExtended" onClick={handleAttach}>
  //           <Iconify icon="solar:gallery-wide-bold" width={24} sx={{ color: 'success.main' }} />
  //           Image/Video
  //         </Fab>

  //         <Fab size="small" color="inherit" variant="softExtended">
  //           <Iconify icon="solar:videocamera-record-bold" width={24} sx={{ color: 'error.main' }} />
  //           Streaming
  //         </Fab>
  //       </Stack>

  //       <Button variant="contained">Post</Button>
  //     </Stack>

  //     <input ref={fileRef} type="file" style={{ display: 'none' }} />
  //   </Card>
  // );

  const renderSocials = (
    <Card>
      <CardHeader title="Réseaux sociaux" />

      <Stack spacing={2} sx={{ p: 3 }}>
        {info.facebookLink && (
          <Stack spacing={2} direction="row" sx={{ wordBreak: 'break-all', typography: 'body2' }}>
            <FacebookIcon />
            <Link href={info.facebookLink} target="_blank" color="inherit">
              {info.facebookLink}
            </Link>
          </Stack>
        )}

        {info.instagramLink && (
          <Stack spacing={2} direction="row" sx={{ wordBreak: 'break-all', typography: 'body2' }}>
            <InstagramIcon />
            <Link href={info.instagramLink} target="_blank" color="inherit">
              {info.instagramLink}
            </Link>
          </Stack>
        )}

        {info.linkedinLink && (
          <Stack spacing={2} direction="row" sx={{ wordBreak: 'break-all', typography: 'body2' }}>
            <LinkedinIcon />
            <Link href={info.linkedinLink} target="_blank" color="inherit">
              {info.linkedinLink}
            </Link>
          </Stack>
        )}

        {info.twitterLink && (
          <Stack spacing={2} direction="row" sx={{ wordBreak: 'break-all', typography: 'body2' }}>
            <TwitterIcon />
            <Link href={info.twitterLink} target="_blank" color="inherit">
              {info.twitterLink}
            </Link>
          </Stack>
        )}
      </Stack>
    </Card>
  );

  // A venir
  const future = (
    <Card>
      <CardHeader title="À venir" />
      <Stack spacing={2} sx={{ p: 3 }}>
        <Typography variant="body2">Cette section sera disponible dans un futur proche.</Typography>
      </Stack>
    </Card>
  );

  return (
    <Grid container spacing={3}>
      <Grid xs={12} md={4}>
        <Stack spacing={3}>
          {/* {renderFollows} */}
          {renderAbout}
          {renderSocials}
        </Stack>
      </Grid>

      <Grid xs={12} md={8}>
        <Stack spacing={3}>
          {/* {renderPostInput} */}

          {/* {posts.map((post) => (
            <ProfilePostItem key={post.id} post={post} />
          ))} */}

          {future}
        </Stack>
      </Grid>
    </Grid>
  );
}
