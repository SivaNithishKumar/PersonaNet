
"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import type { Product } from '@/lib/products';
// No longer importing TryOnPageProps from page.tsx
import { ImageUploader } from '@/components/ImageUploader';
import { ModelSelector } from '@/components/ModelSelector';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { validateImage, type ValidateImageOutput } from '@/ai/flows/validate-image';
import { generateAiTryOn } from '@/ai/flows/generate-ai-try-on';
import { AlertCircle, CheckCircle2, Wand2, Upload, Lightbulb } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Define props for TryOnClient
interface TryOnClientProps {
  params: {
    gender: 'men' | 'women' | 'all';
    itemId: string; // itemId is still part of params for potential future use or context
  };
  product: Product; // Product is now a direct prop
}

export function TryOnClient({ params, product }: TryOnClientProps) {
  // Product data is now received as a prop, no need for useState for product or useEffect to fetch it.
  const [userImage, setUserImage] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<ValidateImageOutput | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('googleai/gemini-2.0-flash');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoadingValidation, setIsLoadingValidation] = useState(false);
  const [isLoadingGeneration, setIsLoadingGeneration] = useState(false);
  const [error, setError] = useState<string | null>(null); // Kept for other runtime errors

  const { toast } = useToast();

  // The useEffect for fetching product and setError for "Product not found" is removed.
  // The 'product' prop is used directly.

  const handleImageUpload = (dataUrl: string) => {
    setUserImage(dataUrl);
    setValidationResult(null); // Reset validation on new image
    setGeneratedImage(null); // Reset generated image
  };

  const handleValidateImage = async () => {
    if (!userImage) {
      toast({ variant: 'destructive', title: 'No Image', description: 'Please upload an image first.' });
      return;
    }
    setIsLoadingValidation(true);
    setValidationResult(null);
    setError(null); // Clear previous errors
    try {
      const result = await validateImage({ photoDataUri: userImage });
      setValidationResult(result);
      if (result.isValid) {
        toast({ title: 'Image Validated', description: 'Your image is suitable for try-on!', className: 'bg-green-500 text-white' });
      } else {
        toast({
          variant: 'destructive',
          title: 'Image Validation Failed',
          description: result.reason || 'The image is not suitable. Please check suggestions.',
          duration: 7000,
        });
      }
    } catch (err) {
      console.error('Validation error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Could not validate the image.';
      setError(errorMessage);
      toast({ variant: 'destructive', title: 'Validation Error', description: errorMessage });
       setValidationResult({ isValid: false, reason: 'An error occurred during validation.', suggestions: 'Please try again or use a different image.' });
    } finally {
      setIsLoadingValidation(false);
    }
  };

  const handleGenerateTryOn = async () => {
    if (!userImage || !product || !validationResult?.isValid) {
      toast({ variant: 'destructive', title: 'Cannot Generate', description: 'Ensure an image is uploaded and validated.' });
      return;
    }
    setIsLoadingGeneration(true);
    setGeneratedImage(null);
    setError(null); // Clear previous errors

    let itemImageDataUri = product.imageUrl;
    // Note: The logic for handling non-data URI itemImage still exists as a potential issue
    // as noted in the original code. For now, we proceed assuming it's usable.
    if (!product.imageUrl.startsWith('data:')) {
        console.warn("Product image URL is not a data URI. AI generation might fail if the model expects a data URI for the item image.");
    }

    try {
      const result = await generateAiTryOn({
        userImage: userImage,
        itemImage: itemImageDataUri, // Use product.imageUrl directly
        model: selectedModel,
      });
      setGeneratedImage(result.generatedImage);
      toast({ title: 'Try-On Complete!', description: 'Check out your new look.', className: 'bg-primary text-primary-foreground' });
    } catch (err) {
      console.error('Generation error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Could not generate the try-on image.';
      setError(errorMessage);
      toast({ variant: 'destructive', title: 'Generation Error', description: errorMessage });
    } finally {
      setIsLoadingGeneration(false);
    }
  };

  // This error display is for other runtime errors (validation, generation),
  // not for initial product loading.
  if (error && !isLoadingValidation && !isLoadingGeneration) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>An Error Occurred</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => setError(null)} className="mt-4">Try again</Button>
      </div>
    );
  }

  // Product is guaranteed by the server component, so no loading state for product needed here.
  
  const isTryOnDisabled = isLoadingGeneration || !validationResult?.isValid || !userImage;

  return (
    <TooltipProvider>
    <div className="container mx-auto px-4 py-8 space-y-8">
      <Card className="overflow-hidden">
        <CardHeader className="bg-muted/30">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="relative w-full md:w-1/4 aspect-[3/4] md:aspect-square rounded-lg overflow-hidden border">
              {/* Use product prop here */}
              <Image src={product.imageUrl} alt={product.name} layout="fill" objectFit="cover" data-ai-hint={product.hint}/>
            </div>
            <div className="flex-1">
              {/* Use product prop here */}
              <CardTitle className="text-3xl font-bold">{product.name}</CardTitle>
              <CardDescription className="text-lg text-muted-foreground">{product.description}</CardDescription>
              <p className="text-2xl font-semibold text-primary mt-2">{product.price}</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-2xl"><Upload className="mr-2 h-6 w-6 text-primary" /> Upload Your Image</CardTitle>
            <CardDescription>Upload a clear, front-facing photo of yourself for the best results.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <ImageUploader onImageUpload={handleImageUpload} />
            {userImage && (
              <Button onClick={handleValidateImage} disabled={isLoadingValidation || !userImage} className="w-full">
                {isLoadingValidation ? <LoadingSpinner size="sm" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Validate Image
              </Button>
            )}

            {validationResult && !validationResult.isValid && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Validation Failed: {validationResult.reason}</AlertTitle>
                <AlertDescription>
                  <Lightbulb className="h-4 w-4 inline mr-1"/>Suggestions: {validationResult.suggestions}
                </AlertDescription>
              </Alert>
            )}
             {validationResult && validationResult.isValid && (
              <Alert variant="default" className="mt-4 border-green-500 bg-green-50 dark:bg-green-900/30">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertTitle className="text-green-700 dark:text-green-300">Image Validated Successfully!</AlertTitle>
                <AlertDescription className="text-green-600 dark:text-green-400">
                  Your image is ready for virtual try-on.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-2xl"><Wand2 className="mr-2 h-6 w-6 text-primary" /> AI Try-On Studio</CardTitle>
            <CardDescription>Select your preferred AI model and generate your new look.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <ModelSelector selectedModel={selectedModel} onModelChange={setSelectedModel} disabled={!validationResult?.isValid || !userImage || isLoadingGeneration} />
          </CardContent>
          <CardFooter>
            <Button onClick={handleGenerateTryOn} disabled={isTryOnDisabled} className="w-full text-lg py-6">
              {isLoadingGeneration ? <LoadingSpinner size="sm" text="Generating..." /> : "Try On Now!"}
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      {(userImage || generatedImage || isLoadingGeneration) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Your Virtual Fitting Room</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-center text-muted-foreground">Your Photo</h3>
              <div className="aspect-square w-full relative rounded-lg overflow-hidden border bg-muted">
                {userImage ? (
                  <Image src={userImage} alt="User uploaded" layout="fill" objectFit="contain" data-ai-hint="person model"/>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">Upload your photo to see it here.</p>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-center text-muted-foreground">AI Try-On Result</h3>
              <div className="aspect-square w-full relative rounded-lg overflow-hidden border bg-muted">
                {isLoadingGeneration && <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-10"><LoadingSpinner text="Creating your look..." /></div>}
                {generatedImage && !isLoadingGeneration ? (
                  <Image src={generatedImage} alt="AI generated try-on" layout="fill" objectFit="contain" data-ai-hint="fashion try on"/>
                ) : !isLoadingGeneration && (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">Your AI generated image will appear here.</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
    </TooltipProvider>
  );
}
