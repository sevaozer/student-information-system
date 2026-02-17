import React, { createContext, useState, useContext, useEffect } from 'react';

// 1. Context oluştur
const AuthContext = createContext(null);

// 2. Provider component
export const AuthProvider = ({ children }) => {
  // user: { Role: "student"|"teacher"|"admin", UserID: number, FullName: string }
  // localStorage'dan kullanıcıyı yükle
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null); 
  
  // 🚨 YENİ STATE: Çıkış mesajını kontrol etmek için
  const [logoutMessage, setLogoutMessage] = useState(null);

    // user değiştiğinde localStorage'ı güncelle
    useEffect(() => {
        if (user) {
            localStorage.setItem('user', JSON.stringify(user));
        } else {
            localStorage.removeItem('user');
        }
    }, [user]);


  // 3. Login fonksiyonu
  const login = (role, userId, fullName) => {
    const userData = {
        // Rolü küçük harfe çevirip, büyük 'R' ile "Role" olarak kaydediyoruz.
        Role: role ? role.toLowerCase() : null,
        UserID: userId,
        FullName: fullName // İsim bilgisini de saklamak faydalı olabilir
    };
    setUser(userData); 
  };

  // 4. Logout fonksiyonu
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user'); // localStorage'ı temizle
    
    // 🚨 ÇIKIŞ MESAJINI AYARLA
    setLogoutMessage("Başarıyla çıkış yaptınız.");
    
    // Mesajı 3 saniye sonra temizle (App.js'te göstermek için zaman ver)
    setTimeout(() => {
      setLogoutMessage(null);
    }, 3000); 
  };

  return (
    // 🚨 DÜZELTME: logoutMessage'ı value'ya ekledik
    <AuthContext.Provider value={{ user, login, logout, logoutMessage, setLogoutMessage }}> 
      {children}
    </AuthContext.Provider>
  );
};

// 5. Custom hook ile contexti kullan
export const useAuth = () => {
  return useContext(AuthContext);
};