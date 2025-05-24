'use client';

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { UserRole } from "../../../src/types";

type SignupFormInputs = {
  role: UserRole;
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  agree: boolean;
};

export default function SignupPage() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormInputs>({
    defaultValues: { role: "student" },
  });

  const [serverError, setServerError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<any>(null);
  const [success, setSuccess] = useState(false);

  const onSubmit = async (data: SignupFormInputs) => {
    setServerError(null);
    setErrorDetails(null);
    setSuccess(false);
    
    try {
      console.log('Sending registration data:', {
        role: data.role,
        name: data.name,
        email: data.email,
        password: '[HIDDEN]'
      });
      
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: data.role,
          name: data.name,
          email: data.email,
          password: data.password,
        }),
      });
      
      const responseData = await res.json();
      
      console.log('API Response:', {
        status: res.status,
        statusText: res.statusText,
        data: responseData
      });
      
      if (!res.ok) {
        setServerError(responseData.error || `HTTP ${res.status}: ${res.statusText}`);
        setErrorDetails({
          status: res.status,
          statusText: res.statusText,
          response: responseData
        });
      } else {
        setSuccess(true);
        console.log('Registration successful:', responseData);
      }
    } catch (error) {
      console.error('Network error:', error);
      setServerError("ネットワークエラーが発生しました: " + (error instanceof Error ? error.message : String(error)));
      setErrorDetails({ networkError: error });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white p-8 rounded shadow">
        <h1 className="text-2xl font-bold mb-6 text-center">新規登録</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* ユーザー種別 */}
          <div>
            <label className="block font-medium mb-1">ユーザー種別</label>
            <div className="flex gap-4">
              <label>
                <input
                  type="radio"
                  value="student"
                  {...register("role", { required: true })}
                  defaultChecked
                />
                <span className="ml-1">学生</span>
              </label>
              <label>
                <input
                  type="radio"
                  value="company"
                  {...register("role", { required: true })}
                />
                <span className="ml-1">企業</span>
              </label>
              <label>
                <input
                  type="radio"
                  value="admin"
                  {...register("role", { required: true })}
                />
                <span className="ml-1">管理者</span>
              </label>
            </div>
            {errors.role && (
              <p className="text-red-500 text-sm mt-1">ユーザー種別を選択してください</p>
            )}
          </div>
          
          {/* 氏名 */}
          <div>
            <label className="block font-medium mb-1">氏名</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              {...register("name", { required: "氏名は必須です" })}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>
          
          {/* メール */}
          <div>
            <label className="block font-medium mb-1">メールアドレス</label>
            <input
              type="email"
              className="w-full border rounded px-3 py-2"
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
              className="w-full border rounded px-3 py-2"
              {...register("password", {
                required: "パスワードは必須です",
                minLength: { value: 8, message: "8文字以上で入力してください" },
                validate: (v) =>
                  /[A-Za-z]/.test(v) && /[0-9]/.test(v) || "英字と数字を含めてください",
              })}
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
            )}
          </div>
          
          {/* パスワード確認 */}
          <div>
            <label className="block font-medium mb-1">パスワード（確認）</label>
            <input
              type="password"
              className="w-full border rounded px-3 py-2"
              {...register("confirmPassword", {
                required: "確認用パスワードは必須です",
                validate: (v) =>
                  v === watch("password") || "パスワードが一致しません",
              })}
            />
            {errors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>
          
          {/* 利用規約同意 */}
          <div>
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                {...register("agree", { required: "利用規約への同意が必要です" })}
              />
              <span className="ml-2">
                <Link href="/terms" className="underline text-blue-600" target="_blank">
                  利用規約
                </Link>
                に同意します
              </span>
            </label>
            {errors.agree && (
              <p className="text-red-500 text-sm mt-1">{errors.agree.message}</p>
            )}
          </div>
          
          {/* サーバーエラー */}
          {serverError && (
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <div className="text-red-600 font-medium">エラーが発生しました</div>
              <div className="text-red-500 text-sm mt-1">{serverError}</div>
              {errorDetails && (
                <details className="mt-2">
                  <summary className="text-xs text-gray-600 cursor-pointer">詳細情報</summary>
                  <pre className="text-xs bg-gray-100 p-2 mt-1 rounded overflow-auto max-h-32">
                    {JSON.stringify(errorDetails, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          )}
          
          {/* 成功メッセージ */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded p-3">
              <div className="text-green-600 font-medium">登録が完了しました！</div>
              <div className="text-green-500 text-sm mt-1">
                ログインページに移動してサインインしてください
              </div>
            </div>
          )}
          
          {/* 登録ボタン */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? "登録中..." : "登録"}
          </button>
        </form>
        
        <div className="mt-4 text-center">
          すでにアカウントをお持ちですか？{" "}
          <Link href="/auth/login" className="text-blue-600 underline">
            ログイン
          </Link>
        </div>
      </div>
    </div>
  );
}
