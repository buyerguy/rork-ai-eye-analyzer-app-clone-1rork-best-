import React from 'react';
import { router } from 'expo-router';
import CameraScreen from '@/components/CameraScreen';

export default function CameraRoute() {
  const handleCapture = (imageUri: string) => {
    router.replace({
      pathname: '/analyzing',
      params: { imageUri }
    });
  };

  const handleClose = () => {
    router.back();
  };

  return (
    <CameraScreen 
      onCapture={handleCapture}
      onClose={handleClose}
    />
  );
}