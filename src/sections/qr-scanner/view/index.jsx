// Imports externes
import jsQR from 'jsqr';
import axios from 'axios';
import { toast } from 'sonner';
import Webcam from 'react-webcam';
import { Camera, CameraOff } from 'lucide-react';
import React, { useRef, useState, useEffect, useCallback } from 'react';

// Imports Material-UI
import {
  Box,
  Card,
  Paper,
  Alert,
  Stack,
  Button,
  Container,
  Typography,
  CardContent,
} from '@mui/material';

import { fCurrency } from 'src/utils/format-number';
import { fEuroDateTime } from 'src/utils/format-time';

// Imports locaux
import { CONFIG } from 'src/config-global';

export function QrScannerView() {
  // États
  const [qrCode, setQrCode] = useState(''); // Code QR détecté
  const [scanning, setScanning] = useState(true); // État du scan
  const [error, setError] = useState(null); // Message d'erreur
  const [scanResult, setScanResult] = useState(null); // Résultat du scan
  const [qrResult, setQrResult] = useState(''); // Données brutes du QR
  const [showWebcam, setShowWebcam] = useState(true); // État de la webcam

  // Refs
  const webcamRef = useRef(null);

  // Configuration de la caméra
  const videoConstraints = {
    width: 720,
    height: 720,
    facingMode: 'environment',
  };

  // Gestion du scan QR
  const handleScan = useCallback(
    (imageSrc) => {
      if (imageSrc && scanning) {
        const image = new Image();
        image.src = imageSrc;
        image.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = image.width;
          canvas.height = image.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(image, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);

          if (code) {
            setScanning(false);
            verifyQrCode(code.data);
          }
        };
      }
    },
    [scanning]
  );

  // Capture d'image
  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      handleScan(imageSrc);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Effet pour le scan continu
  useEffect(() => {
    let timer;
    if (showWebcam && scanning) {
      timer = setInterval(capture, 500);
    }
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showWebcam, scanning]);

  // Vérification du QR code avec l'API
  const verifyQrCode = async (_qrCode) => {
    try {
      const response = await axios.post(
        `${CONFIG.apiUrl}/api/verify-qrcode`,
        {
          qr_code: _qrCode,
        },
        {
          headers: CONFIG.headers,
        }
      );

      if (response.data.valid) {
        toast.success(response.data.message);
        setScanResult({
          order: response.data.order,
          event: response.data.event,
        });
        setQrResult(_qrCode);
      } else {
        toast.error(response.data.message);
        setError(response.data.message);
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || 'Erreur lors de la vérification du QR code';
      toast.error(errorMessage);
      setError(errorMessage);
    }
  };

  // Rendu de l'interface
  return (
    <Container maxWidth="md">
      <Stack spacing={3} sx={{ py: 3 }}>
        {/* Header avec boutons */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems="center"
          justifyContent="space-between"
        >
          <Typography variant="h4">Scanner QR Code</Typography>

          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              color={showWebcam ? 'error' : 'primary'}
              startIcon={showWebcam ? <CameraOff /> : <Camera />}
              onClick={() => setShowWebcam(!showWebcam)}
              aria-label={showWebcam ? 'Désactiver la caméra' : 'Activer la caméra'}
            >
              {showWebcam ? 'Désactiver' : 'Activer'} la caméra
            </Button>

            {scanResult && (
              <Button
                variant="outlined"
                color="primary"
                onClick={() => {
                  setScanResult(null);
                  setQrResult('');
                  setError(null);
                  setShowWebcam(true);
                }}
                aria-label="Nouveau scan"
              >
                Nouveau scan
              </Button>
            )}
          </Stack>
        </Stack>

        {/* Zone de scan */}
        <Paper sx={{ p: { xs: 1, md: 2 } }}>
          <Box
            sx={{
              width: '100%',
              maxWidth: 500,
              aspectRatio: '1',
              position: 'relative',
              margin: '0 auto',
            }}
          >
            {showWebcam ? (
              <>
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  videoConstraints={videoConstraints}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: 8,
                  }}
                />
                {/* Cadre de scan */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '80%',
                    height: '80%',
                    border: '3px solid',
                    borderColor: 'success.main',
                    borderRadius: 2,
                  }}
                />
              </>
            ) : (
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'background.neutral',
                  borderRadius: 2,
                }}
              >
                <Typography color="text.secondary">Caméra désactivée</Typography>
              </Box>
            )}
          </Box>
        </Paper>

        {/* Alerte QR Code détecté */}
        {qrCode && (
          <Alert
            severity="success"
            sx={{ width: '100%' }}
            onClose={() => {
              setQrCode('');
              setScanning(true);
            }}
          >
            <Typography variant="subtitle2">QR Code détecté :</Typography>
            <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
              {qrCode}
            </Typography>
          </Alert>
        )}

        {/* Affichage des erreurs */}
        {error && (
          <Alert
            severity="error"
            variant="outlined"
            onClose={() => setError(null)}
            sx={{ width: '100%' }}
          >
            {error}
          </Alert>
        )}

        {/* Résultat du scan */}
        {scanResult && (
          <Card sx={{ bgcolor: 'success.lighter' }}>
            <CardContent>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle1" color="success.darker" gutterBottom>
                    Informations du billet
                  </Typography>
                  <Card>
                    <CardContent>
                      <Stack spacing={1}>
                        <Typography>N° Billet : {scanResult.order.order_number}</Typography>
                        <Typography>Client : {scanResult.order.customer_name}</Typography>
                        <Typography>Email : {scanResult.order.customer_email}</Typography>
                        <Typography>
                          Date de création : {fEuroDateTime(scanResult.order.created_at)}
                        </Typography>
                      </Stack>
                    </CardContent>
                  </Card>
                </Box>

                <Box>
                  <Typography variant="subtitle1" color="success.darker" gutterBottom>
                    Informations de l&apos;événement
                  </Typography>
                  <Card>
                    <CardContent>
                      <Stack spacing={1}>
                        <Typography>Événement : {scanResult.event.title}</Typography>
                        <Typography>
                          Date : {fEuroDateTime(scanResult.event.scheduled_date)}
                        </Typography>
                        {scanResult.order.total_price && (
                          <Typography>Prix : {fCurrency(scanResult.order.total_price)}</Typography>
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        )}
      </Stack>
    </Container>
  );
}
