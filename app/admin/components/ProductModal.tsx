'use client';

import { useState, useEffect } from 'react';
import { Product } from '@/lib/api';

// ================= TYPES =================
interface ProductInput {
  TENSP: string;
  GIABAN: number;
  SOLUONGTON: number;
  IMAGE_URL?: string;
  DESCRIPTION?: string;
  MANCC?: string;
}

interface ProductModalProps {
  product: Product | null;
  onSave: (product: ProductInput) => Promise<void>;
  onClose: () => void;
}

// ================= UTILS =================
const formatCurrency = (value: number | string) => {
  if (value === '' || value == null) return '';
  const num =
    typeof value === 'string'
      ? Number(value.replace(/[^\d]/g, ''))
      : value;

  if (isNaN(num)) return '';
  return num.toLocaleString('en-US');
};

const parseCurrency = (value: string) => {
  if (!value) return NaN;
  const clean = value.replace(/[^\d]/g, '');
  return clean ? Number(clean) : NaN;
};

const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// ================= COMPONENT =================
export default function ProductModal({
  product,
  onSave,
  onClose,
}: ProductModalProps) {
  const [formData, setFormData] = useState({
    TENSP: '',
    GIABAN: '',
    SOLUONGTON: '',
    IMAGE_URL: '',
    DESCRIPTION: '',
    MANCC: '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ===== LOAD DATA =====
  useEffect(() => {
    if (product) {
      setFormData({
        TENSP: product.TENSP || '',
        GIABAN:
          product.GIABAN != null
            ? formatCurrency(product.GIABAN)
            : '',
        SOLUONGTON:
          product.SOLUONGTON != null
            ? product.SOLUONGTON.toString()
            : '',
        IMAGE_URL: product.IMAGE_URL || '',
        DESCRIPTION: product.DESCRIPTION || '',
        MANCC: product.MANCC || '',
      });
    } else {
      setFormData({
        TENSP: '',
        GIABAN: '',
        SOLUONGTON: '',
        IMAGE_URL: '',
        DESCRIPTION: '',
        MANCC: '',
      });
    }
  }, [product]);

  // ===== ESC CLOSE =====
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // ===== HANDLE CHANGE =====
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    let newValue = value;

    if (name === 'GIABAN') {
      const clean = value.replace(/[^\d]/g, '');
      newValue = clean ? formatCurrency(clean) : '';
    }

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    // clear error realtime
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // ===== VALIDATE =====
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.TENSP.trim()) {
      newErrors.TENSP = 'Tên sản phẩm không được để trống';
    }

    const price = parseCurrency(formData.GIABAN);

    if (!formData.GIABAN.trim()) {
      newErrors.GIABAN = 'Vui lòng nhập giá';
    } else if (isNaN(price) || price <= 0) {
      newErrors.GIABAN = 'Giá phải lớn hơn 0';
    }

    const quantity = Number(formData.SOLUONGTON);

    if (formData.SOLUONGTON === '') {
      newErrors.SOLUONGTON = 'Vui lòng nhập số lượng';
    } else if (isNaN(quantity) || quantity < 0) {
      newErrors.SOLUONGTON = 'Số lượng phải >= 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ===== SUBMIT =====
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const price = parseCurrency(formData.GIABAN);
    const quantity = Number(formData.SOLUONGTON);

    if (isNaN(price) || price <= 0) {
      setErrors((prev) => ({
        ...prev,
        GIABAN: 'Giá không hợp lệ',
      }));
      return;
    }

    try {
      setLoading(true);

      await onSave({
        TENSP: formData.TENSP.trim(),
        GIABAN: price,
        SOLUONGTON: quantity,
        IMAGE_URL: formData.IMAGE_URL,
        DESCRIPTION: formData.DESCRIPTION,
        MANCC: formData.MANCC,
      });

      onClose();
    } catch (error) {
      console.error('Error saving product:', error);
    } finally {
      setLoading(false);
    }
  };

  // ================= UI =================
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">

        {loading && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-50">
            <span className="text-lg font-semibold">Đang xử lý...</span>
          </div>
        )}

        <div className="bg-blue-600 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">
            {product ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm'}
          </h2>
          <button onClick={onClose} className="text-white text-2xl">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          <input
            name="TENSP"
            value={formData.TENSP}
            onChange={handleChange}
            placeholder="Tên sản phẩm"
            className="w-full p-2 border rounded"
          />
          {errors.TENSP && <p className="text-red-500">{errors.TENSP}</p>}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <input
                name="GIABAN"
                value={formData.GIABAN}
                onChange={handleChange}
                placeholder="Giá"
                className="w-full p-2 border rounded"
              />
              {errors.GIABAN && <p className="text-red-500">{errors.GIABAN}</p>}
            </div>

            <div>
              <input
                name="SOLUONGTON"
                value={formData.SOLUONGTON}
                onChange={handleChange}
                type="number"
                placeholder="Số lượng"
                className="w-full p-2 border rounded"
              />
              {errors.SOLUONGTON && <p className="text-red-500">{errors.SOLUONGTON}</p>}
            </div>
          </div>

          <input
            name="IMAGE_URL"
            value={formData.IMAGE_URL}
            onChange={handleChange}
            placeholder="Image URL"
            className="w-full p-2 border rounded"
          />

          {isValidUrl(formData.IMAGE_URL) && (
            <img src={formData.IMAGE_URL} className="w-40 h-40 object-cover border" />
          )}

          <textarea
            name="DESCRIPTION"
            value={formData.DESCRIPTION}
            onChange={handleChange}
            placeholder="Mô tả"
            className="w-full p-2 border rounded"
          />

          <div className="flex gap-4">
            <button className="flex-1 bg-blue-600 text-white p-2 rounded">
              Lưu
            </button>
            <button type="button" onClick={onClose} className="flex-1 bg-gray-300 p-2 rounded">
              Hủy
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}