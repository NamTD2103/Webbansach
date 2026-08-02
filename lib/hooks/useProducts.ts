"use client";

import { useState, useEffect, useCallback } from "react";
import { productAPI, Product } from "@/lib/api";

interface Props {
  page: number;
  searchQuery: string;
  selectedCategory: string;
  selectedType: string;
  priceRange: {
    min: number;
    max: number;
  };
}

export default function useProducts({
  page,
  searchQuery,
  selectedCategory,
  selectedType,
  priceRange,
}: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let response;

      if (searchQuery.trim()) {
        setSearching(true);

        response = await productAPI.search(searchQuery);

        let data = response.data || [];

        data = data.filter(
          (item: Product) =>
            item.GIABAN >= priceRange.min &&
            item.GIABAN <= priceRange.max
        );

        setProducts(data);
        setTotalPages(1);

        return;
      }

      setSearching(false);

      response = await productAPI.getAll(page, 20);

      let data = response.data || [];

      if (selectedCategory) {
        data = data.filter(
          (item: Product) =>
            item.CAT_ID === selectedCategory
        );
      }

      if (selectedType) {
        data = data.filter(
          (item: any) =>
            item.TYPE === selectedType
        );
      }

      data = data.filter(
        (item: Product) =>
          item.GIABAN >= priceRange.min &&
          item.GIABAN <= priceRange.max
      );

      setProducts(data);
      setTotalPages(response.pagination?.pages || 1);
    } catch (err: any) {
      setError(err.message || "Load products failed");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [
    page,
    searchQuery,
    selectedCategory,
    selectedType,
    priceRange,
  ]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    loading,
    searching,
    error,
    totalPages,
    fetchProducts,
  };
}