"use client";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { BrainCircuit } from "lucide-react";

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
  disabled?: boolean;
}

const models = [
  { id: 'googleai/gemini-2.0-flash', name: 'Gemini Flash', description: 'Fast and versatile model.' },
  { id: 'imagen3', name: 'Imagen 3', description: 'Advanced image generation.' },
  { id: 'imagen4', name: 'Imagen 4', description: 'State-of-the-art capabilities.' },
];

export function ModelSelector({ selectedModel, onModelChange, disabled }: ModelSelectorProps) {
  return (
    <div className="space-y-3">
      <Label className="text-base font-semibold flex items-center">
        <BrainCircuit className="h-5 w-5 mr-2 text-primary" />
        Choose AI Model
      </Label>
      <RadioGroup
        value={selectedModel}
        onValueChange={onModelChange}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
        disabled={disabled}
      >
        {models.map((model) => (
          <Label
            key={model.id}
            htmlFor={model.id}
            className={`flex flex-col items-start justify-center rounded-md border-2 p-4 transition-all hover:border-primary ${
              selectedModel === model.id ? "border-primary ring-2 ring-primary" : "border-muted"
            } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value={model.id} id={model.id} disabled={disabled} />
              <span className="font-medium text-foreground">{model.name}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 pl-6">{model.description}</p>
          </Label>
        ))}
      </RadioGroup>
    </div>
  );
}
