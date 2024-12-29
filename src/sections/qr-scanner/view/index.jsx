/* eslint-disable jsx-a11y/media-has-caption */
import React, { useState, useRef, useEffect } from 'react';
import { Camera } from 'lucide-react';
import { Button, Box, Typography, Paper } from '@mui/material';
import { toast } from 'sonner';
import axios from 'axios';

// ----------------------------------------------------------------------

export function QrScannerView() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const startScanner = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsScanning(true);
        scanQRCode();
      }
    } catch (err) {
      toast.error("Impossible d'accéder à la caméra. Veuillez vérifier les permissions.");
      setError("Impossible d'accéder à la caméra. Veuillez vérifier les permissions.");
    }
  };

  const stopScanner = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
      setIsScanning(false);
    }
  };

  const verifyQrCode = async (qrCode) => {
    try {
      const response = await axios.post('http://localhost:8000/api/verify-qrcode', {
        qr_code: qrCode,
      });

      if (response.data.valid) {
        toast.success('QR Code validé avec succès!');
        setScanResult({
          order: response.data.order,
          event: response.data.event,
        });
      } else {
        toast.error(response.data.message);
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || 'Erreur lors de la vérification du QR code';
      toast.error(errorMessage);
      setError(errorMessage);
    }
  };

  const scanQRCode = () => {
    if (!isScanning) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.height = video.videoHeight;
      canvas.width = video.videoWidth;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Simuler une détection de QR code
      const mockQrCode = 'mock-qr-data';
      verifyQrCode(mockQrCode);

      // Si aucun QR code n'est détecté, continuez le scan
      requestAnimationFrame(scanQRCode);
    } else {
      requestAnimationFrame(scanQRCode);
    }
  };

  useEffect(() => () => stopScanner(), []);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Scanner QR Code
      </Typography>

      <Paper
        sx={{
          position: 'relative',
          width: '100%',
          maxWidth: 'md',
          aspectRatio: '1/1',
          overflow: 'hidden',
          bgcolor: 'grey.100',
          borderRadius: 2,
        }}
      >
        <video
          ref={videoRef}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
          autoPlay
          playsInline
          muted
        >
          <track kind="captions" />
        </video>
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {!isScanning && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Camera sx={{ width: 64, height: 64, color: 'grey.400' }} />
          </Box>
        )}
      </Paper>

      <Button variant="contained" onClick={isScanning ? stopScanner : startScanner} color="primary">
        {isScanning ? 'Arrêter' : 'Démarrer le scan'}
      </Button>

      {scanResult && (
        <Paper
          sx={{
            mt: 2,
            p: 2,
            bgcolor: 'success.light',
            color: 'success.dark',
            borderRadius: 1,
          }}
        >
          <Typography>QR Code validé avec succès!</Typography>
          <Typography sx={{ fontFamily: 'monospace', mt: 1 }}>
            {JSON.stringify(scanResult)}
          </Typography>
        </Paper>
      )}
    </Box>
  );
}
