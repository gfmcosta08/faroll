import React, { useState, useRef } from "react";
import { Camera, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface ImageUploadProps {
  currentImage?: string | null;
  onImageChange: (url: string) => void;
  userId: string;
  className?: string;
  saveToDatabase?: boolean; // Se false, só faz upload sem UPDATE no banco
  onFileSelect?: (file: File | null) => void; // Para guardar arquivo para upload posterior
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ 
  currentImage, 
  onImageChange, 
  userId, 
  className = "",
  saveToDatabase = true,
  onFileSelect
}) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImage || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        alert("Por favor, selecione uma imagem válida");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert("A imagem deve ter no máximo 5MB");
        return;
      }

      setUploading(true);

      const localPreview = URL.createObjectURL(file);
      setPreviewUrl(localPreview);

      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

      if (uploadError) {
        console.error("Erro no upload:", uploadError);

        if (uploadError.message.includes("already exists")) {
          await supabase.storage.from("avatars").remove([filePath]);

          const { error: retryError } = await supabase.storage.from("avatars").upload(filePath, file, {
            cacheControl: "3600",
            upsert: true,
          });

          if (retryError) throw retryError;
        } else {
          throw uploadError;
        }
      }

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
        throw new Error("Erro ao obter URL da imagem");
      }

      // Só atualiza no banco se saveToDatabase = true
      if (saveToDatabase) {
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ avatar_url: urlData.publicUrl })
          .eq("user_id", userId);

        if (updateError) {
          console.error("Erro ao atualizar profile:", updateError);
          throw updateError;
        }
      }

      // Notifica o arquivo selecionado se callback existir
      if (onFileSelect) {
        onFileSelect(file);
      }

      onImageChange(urlData.publicUrl);
      setPreviewUrl(urlData.publicUrl);
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      alert("Erro ao fazer upload da imagem. Tente novamente.");
      setPreviewUrl(currentImage || null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    try {
      setUploading(true);

      const { error } = await supabase.from("profiles").update({ avatar_url: null }).eq("user_id", userId);

      if (error) throw error;

      setPreviewUrl(null);
      onImageChange("");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Erro ao remover imagem:", error);
      alert("Erro ao remover imagem. Tente novamente.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <div className="relative">
        <div className="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
          {previewUrl ? (
            <img src={previewUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <Camera className="w-12 h-12 text-gray-400" />
          )}
        </div>

        {previewUrl && !uploading && (
          <button
            onClick={handleRemoveImage}
            className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1.5 shadow-lg hover:bg-red-600 transition-colors"
            title="Remover foto"
          >
            <X size={16} />
          </button>
        )}

        {uploading && (
          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />

      <Button
        type="button"
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="flex items-center gap-2"
      >
        <Upload size={16} />
        {uploading ? "Enviando..." : previewUrl ? "Trocar Foto" : "Adicionar Foto"}
      </Button>

      <p className="text-xs text-gray-500 text-center">Formatos aceitos: JPG, PNG, GIF (máx. 5MB)</p>
    </div>
  );
};
