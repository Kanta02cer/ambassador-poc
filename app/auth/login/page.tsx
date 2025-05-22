'use client';

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { useRouter } from "next/navigation";

type LoginFormInputs = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormInputs>();

  const [serverError, setServerError] = useState<string | null>(null);

  const onSubmit = async (data: LoginFormInputs) => {
    setServerError(null);
    
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        setServerError(err.message || "ログインに失敗しました");
        return;
      }

      const result = await res.json();
      
      // トークンをローカルストレージに保存
      localStorage.setItem("accessToken", result.accessToken);
      
      // ユーザー種別に応じてリダイレクト
      if (result.user.role === "student") {
        router.push("/student/dashboard");
      } else if (result.user.role === "company") {
        router.push("/company/dashboard");
      } else if (result.user.role === "admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/");
      }
    } catch {
      setServerError("サーバーエラーが発生しました");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white p-8 rounded shadow">
        <h1 className="text-2xl font-bold mb-6 text-center">ログイン</h1>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* メールアドレス */}
          <div>
            <label className="block font-medium mb-1">メールアドレス</label>
            <input
              type="email"
              className="w-full border rounded px-3 py-2 focus:border-blue-500 focus:outline-none"
              placeholder="email@example.com"
              {...register("email", {
                required: "メールアドレスは必須です",
                pattern: {
                  value: /^[^@]+@[^@]+\.[^@]+$/,
                  message: "メールアドレスの形式が正しくありません",
                },
              })}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* パスワード */}
          <div>
            <label className="block font-medium mb-1">パスワード</label>
            <input
              type="password"
              className="w-full border rounded px-3 py-2 focus:border-blue-500 focus:outline-none"
              placeholder="パスワードを入力"
              {...register("password", {
                required: "パスワードは必須です",
              })}
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
            )}
          </div>

          {/* サーバーエラー */}
          {serverError && (
            <div className="text-red-500 text-center bg-red-50 p-2 rounded">
              {serverError}
            </div>
          )}

          {/* ログインボタン */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 transition duration-200"
            disabled={isSubmitting}
          >
            {isSubmitting ? "ログイン中..." : "ログイン"}
          </button>
        </form>

        {/* 新規登録リンク */}
        <div className="mt-6 text-center">
          <p className="text-gray-600">アカウントをお持ちでない方</p>
          <Link href="/auth/signup" className="text-blue-600 underline font-medium">
            新規登録はこちら
          </Link>
        </div>

        {/* デモ用のテストアカウント情報 */}
        <div className="mt-6 p-3 bg-gray-100 rounded text-sm">
          <p className="font-medium text-gray-700 mb-1">テスト用アカウント：</p>
          <p className="text-gray-600">学生: student@test.com / password123</p>
          <p className="text-gray-600">企業: company@test.com / password123</p>
          <p className="text-gray-600">管理者: admin@test.com / password123</p>
        </div>
      </div>
    </div>
  );
}
