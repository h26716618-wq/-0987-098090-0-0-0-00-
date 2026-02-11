#!/bin/bash
# ملف فحص جاهزية المشروع للرفع

echo "🔍 فحص جاهزية المشروع للرفع على الاستضافة..."
echo ""

# 1. فحص Node.js
echo "1️⃣ فحص Node.js..."
if command -v node &> /dev/null; then
    echo "   ✅ Node.js موجود: $(node -v)"
else
    echo "   ❌ Node.js غير موجود"
    exit 1
fi

# 2. فحص npm
echo "2️⃣ فحص npm..."
if command -v npm &> /dev/null; then
    echo "   ✅ npm موجود: $(npm -v)"
else
    echo "   ❌ npm غير موجود"
    exit 1
fi

# 3. فحص التبعيات
echo "3️⃣ فحص التبعيات..."
if [ -d "node_modules" ]; then
    echo "   ✅ node_modules موجود"
else
    echo "   ⚠️  node_modules غير موجود - سيتم تثبيت التبعيات تلقائياً"
fi

# 4. فحص الملفات الأساسية
echo "4️⃣ فحص الملفات الأساسية..."
required_files=("server.js" "package.json" "admin.html" "editor.html" "parents.html" "login.html" "index.html")
for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "   ✅ $file"
    else
        echo "   ❌ $file غير موجود"
        exit 1
    fi
done

# 5. فحص ملفات الاستضافة
echo "5️⃣ فحص ملفات الاستضافة..."
deployment_files=(".env" ".gitignore" "Procfile" "DEPLOYMENT.md" "SECURITY.md")
for file in "${deployment_files[@]}"; do
    if [ -f "$file" ]; then
        echo "   ✅ $file"
    else
        echo "   ⚠️  $file غير موجود (سيتم إنشاؤه)"
    fi
done

echo ""
echo "✅ الفحص الأساسي نجح!"
echo ""
echo "القطوات التالية:"
echo "1. تأكد من تغيير رمز PIN في login.html"
echo "2. اختبر السيرفر: npm start"
echo "3. اتبع التعليمات في DEPLOYMENT.md"
echo ""
