"use client";

import { useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2, Plus, Save, X, ImagePlus, Link as LinkIcon } from "lucide-react"; 
import { productSchema, type ProductFormValues } from "@/lib/validators/product";

interface ProductFormProps {
  initialData?: ProductFormValues;
  onSubmit: (data: ProductFormValues) => void;
  isLoading?: boolean;
}

export default function ProductForm({
  initialData,
  onSubmit,
  isLoading = false,
}: ProductFormProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: initialData || {
      name: "",
      description: "",
      basePrice: 0,
      weightGrams: 100,
      categoryId: 0,
      brandId: 0,
      variants: [
        // Default now includes empty imageUrl array
        { sku: "", price: 0, stockQuantity: 0, imageUrl: [] },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "variants",
  });

  console.log(errors);
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-5xl mx-auto p-6 bg-white shadow-sm border border-gray-100 rounded-xl">
      
      {/* --- BAGIAN 1: DATA PRODUK UTAMA --- */}
      <div className="space-y-6 border-b border-gray-100 pb-8">
        <div>
            <h2 className="text-xl font-bold text-gray-900">Informasi Produk</h2>
            <p className="text-sm text-gray-500">Lengkapi detail dasar produk Anda.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Produk</label>
            <input
              {...register("name")}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-black focus:border-transparent transition"
              placeholder="Contoh: Nike Air Jordan 1 High"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Kategori ID</label>
            <input
              type="number"
              {...register("categoryId", { valueAsNumber: true })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
            />
            {errors.categoryId && <p className="text-red-500 text-xs mt-1">{errors.categoryId.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Brand ID (Opsional)</label>
            <input
              type="number"
              {...register("brandId", { valueAsNumber: true })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Harga Dasar (Rp)</label>
            <input
              type="number"
              {...register("basePrice", { valueAsNumber: true })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Berat (Gram)</label>
            <input
              type="number"
              {...register("weightGrams", { valueAsNumber: true })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Deskripsi</label>
            <textarea
              {...register("description")}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 h-32 resize-none"
              placeholder="Jelaskan fitur utama produk..."
            />
          </div>
        </div>
      </div>

      {/* --- BAGIAN 2: VARIAN PRODUK --- */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Varian Produk</h2>
            <p className="text-sm text-gray-500">Kelola SKU, harga, stok, dan foto untuk setiap varian.</p>
          </div>
          <button
            type="button"
            onClick={() => append({ sku: "", price: 0, stockQuantity: 0, imageUrl: [] })}
            className="flex items-center gap-2 text-sm font-medium bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition shadow-sm"
          >
            <Plus size={16} /> Tambah Varian
          </button>
        </div>

        {errors.variants && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-md">{errors.variants.message}</p>}

        <div className="space-y-6">
          {fields.map((field, index) => (
            <div key={field.id} className="border border-gray-200 p-6 rounded-xl bg-gray-50/50 relative group transition hover:border-gray-300 hover:shadow-sm">
              
              {/* Variant Header Badge */}
              <div className="absolute -top-3 -left-3 bg-white border border-gray-200 text-gray-800 text-xs font-bold w-8 h-8 flex items-center justify-center rounded-full shadow-sm z-10">
                {index + 1}
              </div>

              {/* Remove Variant Button */}
              <div className="absolute top-4 right-4">
                <button
                  type="button"
                  onClick={() => remove(index)}
                  disabled={fields.length === 1}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition disabled:opacity-30"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Inputs Basic */}
                <div className="md:col-span-4 space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">SKU</label>
                        <input
                            {...register(`variants.${index}.sku`)}
                            placeholder="Contoh: NIKE-AIR-001"
                            className="w-full mt-1 border border-gray-300 rounded-md p-2 text-sm font-mono"
                        />
                         {errors.variants?.[index]?.sku && <p className="text-red-500 text-xs mt-1">{errors.variants[index]?.sku?.message}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Harga</label>
                            <input
                                type="number"
                                {...register(`variants.${index}.price`, { valueAsNumber: true })}
                                className="w-full mt-1 border border-gray-300 rounded-md p-2 text-sm"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Stok</label>
                            <input
                                type="number"
                                {...register(`variants.${index}.stockQuantity`, { valueAsNumber: true })}
                                className="w-full mt-1 border border-gray-300 rounded-md p-2 text-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Image Manager Area */}
                <div className="md:col-span-8 bg-white p-4 rounded-lg border border-gray-200">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 block">Galeri Foto Varian</label>
                    
                    {/* Controller for Image Array */}
                    <Controller
                        control={control}
                        name={`variants.${index}.imageUrl`}
                        render={({ field: { value = [], onChange } }) => (
                            <ImageArrayManager 
                                urls={value} 
                                onChange={onChange} 
                            />
                        )}
                    />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Action */}
      <div className="pt-6 border-t border-gray-100 sticky bottom-0 bg-white/80 backdrop-blur-sm p-4 -mx-6 -mb-6 rounded-b-xl z-20">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-black text-white py-3.5 rounded-xl font-bold hover:bg-gray-800 transition disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform active:scale-[0.99]"
        >
          {isLoading ? (
            <span className="animate-pulse">Menyimpan Produk...</span>
          ) : (
            <><Save size={20} /> Simpan Produk</>
          )}
        </button>
      </div>
    </form>
  );
}

// --- SUB-COMPONENT: Image Manager (Internal) ---
function ImageArrayManager({ urls, onChange }: { urls: string[], onChange: (urls: string[]) => void }) {
    const [inputVal, setInputVal] = useState("");

    const handleAdd = () => {
        if (!inputVal.trim()) return;
        // Basic URL validation could go here
        onChange([...urls, inputVal.trim()]);
        setInputVal("");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault(); // Prevent form submit
            handleAdd();
        }
    };

    const handleRemove = (idxToRemove: number) => {
        onChange(urls.filter((_, i) => i !== idxToRemove));
    };

    return (
        <div className="space-y-4">
            {/* Input Area */}
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <LinkIcon size={14} />
                    </div>
                    <input
                        type="text"
                        value={inputVal}
                        onChange={(e) => setInputVal(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Tempel URL gambar disini lalu tekan Enter..."
                        className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-black focus:border-black transition"
                    />
                </div>
                <button
                    type="button"
                    onClick={handleAdd}
                    disabled={!inputVal}
                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200 disabled:opacity-50 transition"
                >
                    Tambah
                </button>
            </div>

            {/* Preview Grid */}
            {urls.length > 0 ? (
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
                    {urls.map((url, i) => (
                        <div key={i} className="group relative aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                            <img 
                                src={url} 
                                alt={`Variant img ${i}`} 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = "https://placehold.co/100?text=Error";
                                }}
                            />
                            {/* Overlay Remove Button */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button
                                    type="button"
                                    onClick={() => handleRemove(i)}
                                    className="bg-white text-red-500 p-1.5 rounded-full hover:bg-red-50 transition transform hover:scale-110"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                            {/* Primary Badge */}
                            {i === 0 && (
                                <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] font-bold text-center py-0.5">
                                    UTAMA
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-6 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50/50">
                    <ImagePlus className="text-gray-300 mb-2" size={24} />
                    <p className="text-xs text-gray-400">Belum ada foto varian</p>
                </div>
            )}
        </div>
    );
}