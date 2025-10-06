

export const langTr = {
  common: {
    back: 'Geri',
    save: 'Kaydet',
    next: 'İlerle',
    nextDynamic: 'İlerle ({count}/{total})',
    loading: 'Yükleniyor...',
    done: 'Bitir',
    skip: 'Atla',
    error: 'Hata',
    emailExistsTitle: 'E-posta Zaten Mevcut',
    emailExistsDescription: 'Girdiğiniz e-posta adresi zaten bir hesaba bağlı. Giriş sayfasına yönlendiriliyorsunuz.',
    goToLogin: 'Giriş Yap',
    editProfile: 'Profili Düzenle',
    logout: 'Çıkış Yap',
    logoutConfirmTitle: 'Çıkış Yapmak İstediğinizden Emin misiniz?',
    logoutConfirmDescription: 'Bu işlem sizi mevcut oturumunuzdan çıkaracaktır. Tekrar erişmek için giriş yapmanız gerekecektir.',
    cancel: 'İptal',
    delete: 'Sil',
    or: 'veya',
    and: 've',
  },
  welcome: {
    agreement: 'Oturum aç\'a dokunarak <1>Şartlarımızı</1> kabul edersin. Verilerini nasıl işlediğimizi öğrenmek için <3>Gizlilik Politikası</3> ve <5>Çerez Politikası</5>\'nı inceleyebilirsin.',
    continueWithGoogle: 'Google ile devam et',
    continueWithEmail: 'E-posta ile devam et',
    loginIssues: 'Oturum açarken sorun mu yaşıyorsun?',
  },
  login: {
    title: 'E-posta ile Giriş',
    emailStepTitle: 'E-postan nedir?',
    emailPlaceholder: 'E-posta adresini gir',
    emailHint: 'Lütfen sistemde kayıtlı e-mail adresinizi giriniz, ardından şifre adımına yönlendirileceksiniz.',
    passwordStepTitle: 'Şifreni gir',
    passwordPlaceholder: 'Şifreni gir',
    change: 'Değiştir',
    noAccount: 'Henüz hesabın yokmu?',
    signupNow: 'O zaman kayıt ol',
    errors: {
      authServiceError: 'Kimlik doğrulama hizmeti yüklenemedi.',
      emailCheckError: 'E-posta kontrol edilirken bir sorun yaşandı. Lütfen tekrar deneyin.',
      emailNotRegistered: 'Bu e-posta kayıtlı değil. Lütfen önce kayıt olunuz.',
      invalidEmail: 'Geçersiz e-posta adresi.',
      wrongPassword: 'Şifreniz yanlış. Lütfen tekrar deneyin.',
      googleRedirectTitle: 'Google Hesabı Tespit Edildi',
      googleRedirectDescription: 'Bu e-posta bir Google hesabıyla ilişkilendirilmiştir. Lütfen Google ile devam ederek giriş yapın.',
      otherProvider: 'Bu e-posta {provider} ile kayıtlı. Lütfen o yöntemle giriş yapın.',
      googleLoginFailedTitle: 'Google ile Giriş Başarısız',
      googleLoginFailed: 'Google ile giriş yapılırken bir hata oluştu. Lütfen tekrar deneyin.',
    },
  },
  rules: {
    welcome: 'BeMatch\'e Hoş Geldin.',
    description: 'Harika bir topluluk oluşturmamıza yardımcı olmak için lütfen aşağıdaki kurallara uymayı unutma.',
    rule1Title: 'Kendin ol.',
    rule1Desc: 'Fotoğraflarının, yaşının ve biyografinin gerçeği yansıttığından emin ol.',
    rule2Title: 'Nazik ol.',
    rule2Desc: 'Diğer kullanıcılara saygı göster ve sana nasıl davranılmasını istiyorsan onlara da öyle davran.',
    rule3Title: 'Dikkatli ol.',
    rule3Desc: 'Kişisel bilgilerini paylaşmadan önce iyi düşün. Güvenliğin bizim için önemli.',
    rule4Title: 'Proaktif ol.',
    rule4Desc: 'Topluluğumuzu güvende tutmak için uygunsuz davranışları mutlaka bize bildir.',
    agree: 'Onaylıyorum',
  },
  signup: {
    progressHeader: {
        skip: 'Atla',
    },
    common: {
        next: 'İlerle',
        nextDynamic: 'İlerle ({count}/{total})',
        emailExistsTitle: 'E-posta Zaten Mevcut',
        emailExistsDescription: 'Girdiğiniz e-posta adresi zaten bir hesaba bağlı. Giriş sayfasına yönlendiriliyorsunuz.',
        goToLogin: 'Giriş Yap',
    },
    step1: {
      title: 'Hesabını oluştur',
      description: 'Maceraya başlamak için e-posta ve şifreni belirle.',
      emailLabel: 'E-posta Adresin',
      passwordLabel: 'Şifren',
      confirmPasswordLabel: 'Şifreni Tekrarla',
    },
    step2: {
      title: 'Adın ne?',
      placeholder: 'Adını gir',
      label: 'Profilinde bu şekilde görünecek. Bunu daha sonra değiştiremezsin.',
    },
    step3: {
      title: 'Doğum tarihin?',
      label: 'Profilinde yaşın gösterilir, doğum tarihin değil.',
      dayPlaceholder: 'GG',
      monthPlaceholder: 'AA',
      yearPlaceholder: 'YYYY',
      ageConfirm: 'Tebrikler! 18 yaşından büyüksünüz.',
      ageError: "18 yaşından küçükler uygulamayı kullanamaz.",
      errors: {
        minAge: 'En az 18 yaşında olmalısın.',
        invalidDate: 'Geçerli bir tarih girin.'
      }
    },
    step4: {
      title: 'Ben bir...',
      woman: 'Kadın',
      man: 'Erkek',
    },
    step5: {
      title: 'Ne arıyorsun?',
      label: "Merak etme, bunu daha sonra profilinden istediğin zaman değiştirebilirsin.",
      options: [
        { id: 'long-term', label: 'Uzun süreli ilişki' },
        { id: 'short-term', label: 'Kısa süreli ilişki' },
        { id: 'friends', label: 'Yeni arkadaşlar' },
        { id: 'casual', label: 'Takılmak için' },
        { id: 'not-sure', label: "Emin değilim" },
        { id: 'whatever', label: 'Her şeye açığım' },
      ],
    },
    step6: {
      title: 'Konumunu Paylaş',
      description: 'Çevrendeki potansiyel eşleşmeleri görebilmek için konumunu bizimle paylaşman gerekiyor.',
      button: 'Konumumu Paylaş',
      errorTitle: 'Konum İzni Reddedildi',
      errorMessage: 'Eşleşmeleri bulmak için konum izni gereklidir. Lütfen tarayıcı ayarlarından izin verin.',
    },
    step7: {
      title: 'Mesafe tercihin nedir?',
      description: 'Potansiyel eşleşmelerin bulunmasını istediğin maksimum mesafeyi ayarlamak için kaydırıcıyı kullan.',
      label: 'Mesafe Tercihi',
      unit: 'Km',
      info: "Tercihleri daha sonra Ayarlar'dan değiştirebilirsin",
    },
    step8: {
      title: 'Okulunu yazmak istersen...',
      placeholder: 'Okulunu gir',
      label: 'Profilinde bu şekilde görünecek.',
    },
    step9: {
      title: '{name}, biraz da yaşam tarzı alışkanlıklarından bahsedelim',
      description: 'Eşleşme adaylarının alışkanlıkları, seninkilerle uyumlu mu? İlk sen başla.',
      drinking: {
        question: 'Ne sıklıkla içki içersin?',
        options: [
          { id: 'not_for_me', label: 'Bana göre değil' },
          { id: 'dont_drink', label: "İçmiyorum" },
          { id: 'rarely', label: 'Nadiren' },
          { id: 'special_occasions', label: 'Özel günlerde' },
          { id: 'socially_weekends', label: 'Hafta sonları sosyalleşirken' },
          { id: 'most_nights', label: 'Çoğu gece' },
        ],
      },
      smoking: {
        question: 'Ne sıklıkla sigara içersin?',
        options: [
          { id: 'social_smoker', label: 'Sosyal içici' },
          { id: 'with_drinks', label: 'İçkiyle birlikte' },
          { id: 'non_smoker', label: 'Kullanmıyorum' },
          { id: 'smoker', label: 'Sigara Kullanan' },
          { id: 'trying_to_quit', label: 'Bırakmaya çalışıyorum' },
        ],
      },
      workout: {
        question: 'Spor yapıyor musun?',
        options: [
          { id: 'everyday', label: 'Her gün' },
          { id: 'often', label: 'Sık sık' },
          { id: 'sometimes', label: 'Ara sıra' },
          { id: 'never', label: 'Asla yapmam' },
        ],
      },
      pets: {
        question: 'Evcil hayvanın var mı?',
        options: [
          { id: 'dog', label: 'Köpek' },
          { id: 'cat', label: 'Kedi' },
          { id: 'reptile', label: 'Sürüngen' },
          { id: 'amphibian', label: 'Amfibik' },
          { id: 'bird', label: 'Kuş' },
          { id: 'fish', label: 'Balık' },
          { id: 'none_but_love', label: 'Hayvanım yok ama çok severim' },
          { id: 'other', label: 'Diğer' },
          { id: 'turtle', label: 'Kaplumbağa' },
          { id: 'hamster', label: 'Hamster' },
          { id: 'rabbit', label: 'Tavşan' },
          { id: 'dont_like', label: "Hoşlanmam" },
          { id: 'all_pets', label: 'Tüm evcil hayvanlar' },
        ],
      },
    },
    step10: {
        title: '{name}, seni sen yapan başka neler var?',
        description: "Kendini ortaya koymaktan çekinme. Özgün olmak cazibelidir.",
        communication: {
            question: 'İletişim tarzını nasıl tanımlarsın?',
            options: [
                { id: 'good_texter', label: 'Mesajlaşmada iyiyim' },
                { id: 'caller', label: 'Ararım' },
                { id: 'video_chat', label: 'Video sohbet' },
                { id: 'bad_texter', label: 'Mesajlaşmada kötüyüm' },
                { id: 'face_to_face', label: 'Yüz yüze' },
            ],
        },
        loveLanguage: {
            question: 'Aşkını nasıl ifade edersin?',
            options: [
                { id: 'thoughtful_actions', label: 'Düşünceli davranışlarla' },
                { id: 'gifts', label: 'Hediyelerle' },
                { id: 'touch', label: 'Dokunarak' },
                { id: 'compliments', label: 'İltifat duymak' },
                { id: 'quality_time', label: 'Birlikte zaman geçirerek' },
            ],
        },
        education: {
            question: 'Eğitim seviyen nedir?',
            options: [
                { id: 'university_grad', label: 'Üniversite Mezunları' },
                { id: 'bachelor_student', label: 'Lisans Öğrencisi' },
                { id: 'high_school', label: 'Lise' },
                { id: 'phd', label: 'Doktora' },
                { id: 'master_student', label: 'Yüksek Lisans Öğrencisi' },
                { id: 'master_grad', label: 'Yüksek Lisans Mezunu' },
                { id: 'technical_school', label: 'Teknik Okul' },
            ],
        },
        zodiac: {
            question: 'Burcun nedir?',
            options: [
                { id: 'capricorn', label: 'Oğlak' },
                { id: 'aquarius', label: 'Kova' },
                { id: 'pisces', label: 'Balık' },
                { id: 'aries', label: 'Koç' },
                { id: 'taurus', label: 'Boğa' },
                { id: 'gemini', label: 'İkizler' },
                { id: 'cancer', label: 'Yengeç' },
                { id: 'leo', label: 'Aslan' },
                { id: 'virgo', label: 'Başak' },
                { id: 'libra', label: 'Terazi' },
                { id: 'scorpio', label: 'Akrep' },
                { id: 'sagittarius', label: 'Yay' },
            ],
        },
    },
    step11: {
        title: 'İlgini çeken konular neler?',
        description: 'Sevdiğin şeyleri paylaşan kişileri bulmana yardımcı olması için profiline {count} ilgi alanı ekle.',
        categories: [
            {
                title: 'Müzik',
                icon: 'Music',
                options: ['Gospel', 'Müzik Grupları', 'Rock', 'Soul', 'Pop', 'K-Pop', 'Punk', 'Rap', 'Folk', 'Latin', 'Alternatif', 'Tekno', 'Caz', 'House', 'EDM', 'R&B', 'Indie', 'Opera', 'Heavy Metal', 'Funk', 'Reggaeton', 'Country', 'Hip Hop', 'J-Pop', 'Elektronik', 'Grime', '90lar Britpop', 'Trap', 'Müzik']
            },
            {
                title: 'Dışarı Çıkmak',
                icon: 'DoorOpen',
                options: ['Kaçış Odaları', 'Barlar', 'İkinci El Alışverişi', 'Müzeler', 'Partiler', 'Arabalı Sinemalar', 'Müzikaller', 'Kafe Gezintisi', 'Akvaryum', 'Kulüpler', 'Sergiler', 'Alışveriş', 'Arabalar', 'Pub Quiz', 'Festivaller', 'Happy Hour', 'Stand-up Komedi', 'Karaoke', 'Ev Partileri', 'Tiyatro', 'Nargile', 'Paten', 'Canlı Müzik', 'Bar Gezintisi', 'Bowling', 'Motosikletler']
            },
            {
                title: 'Açık Hava ve Macera',
                icon: 'Tent',
                options: ['Kürek Çekme', 'Tüplü Dalış', 'Jet Ski', 'Yürüyüş Turları', 'Doğa', 'Sıcak Su Kaynakları', 'Köpek Gezdirme', 'Kayak', 'Kano', 'Kar Kayağı', 'Yol Gezileri', 'Couchsurfing', 'Serbest Dalış', 'Seyahat', 'Stand-up Paddle', 'Sörf', 'Plaj Barları', 'Yamaç Paraşütü', 'Yelken', 'Yürüyüş', 'Dağlar', 'Sırt Çantasıyla Gezme', 'Kaya Tırmanışı', 'Balık Tutma', 'Kamp', 'Açık Hava', 'Piknikler']
            },
            {
                title: 'Değerler ve Amaçlar',
                icon: 'Globe',
                options: ['Ruh Sağlığı Farkındalığı', 'Seçmen Hakları', 'İklim Değişikliği', 'LGBTQIA+ Hakları', 'Feminizm', 'Black Lives Matter', 'Kapsayıcılık', 'İnsan Hakları', 'Sosyal Gelişim', 'Gönüllülük', 'Çevrecilik', 'Dünya Barışı', 'Onur Yürüyüşü', 'Gençlik Güçlendirmesi', 'Eşitlik', 'Politika', 'Aktivizm', 'Engelli Hakları']
            },
            {
                title: 'Evde Takılmak',
                icon: 'Home',
                options: ['Okuma', 'Dizi/Film Maratonu', 'Evde Egzersiz', 'Bilgi Yarışmaları', 'Yemek Pişirme', 'Online Oyunlar', 'Online Alışveriş', 'Bahçe İşleri', 'Kutu Oyunları', 'Fırıncılık']
            },
            {
                title: 'Kurmaca Evrenler',
                icon: 'Sparkles',
                options: ['Comic Con', 'Harry Potter', '90lar Çocuğu', 'NBA', 'MLB', 'Zindanlar ve Ejderhalar', 'Manga', 'Marvel', 'Disney']
            },
            {
                title: 'TV ve Filmler',
                icon: 'Clapperboard',
                options: ['Aksiyon Filmleri', 'Animasyon Filmleri', 'Suç Dizileri', 'Drama Dizileri', 'Fantastik Filmler', 'Belgeseller', 'Bağımsız Filmler', 'Reality Şovlar', 'Romantik Komediler', 'Spor Şovları', 'Gerilim Filmleri', 'K-Dramalar', 'Korku Filmleri', 'Bollywood', 'Sinema', 'Bilim Kurgu', 'Anime', 'Komedi']
            },
            {
                title: 'Yaratıcılık',
                icon: 'Paintbrush',
                options: ['El Sanatları', 'Yazarlık', 'Dans', 'Resim', 'Tasarım', 'Makyaj']
            },
            {
                title: 'Oyun',
                icon: 'Gamepad2',
                options: ['PlayStation', 'E-spor', 'Fortnite', 'Xbox', 'League of Legends', 'Nintendo', 'Among Us', 'Arcade', 'Roblox']
            },
            {
                title: 'Sağlık ve Yaşam Tarzı',
                icon: 'Sprout',
                options: ['Kendini Sevme', 'Yeni Şeyler Deneme', 'Tarot', 'Spa', 'Kişisel Gelişim', 'Meditasyon', 'Cilt Bakımı', 'Astroloji', 'Farkındalık', 'Sauna', 'Aktif Yaşam Tarzı', 'Yoga']
            },
            {
                title: 'Sosyal Medya İçerikleri',
                icon: 'MessageCircle',
                options: ['Instagram', 'X', 'SoundCloud', 'Pinterest', 'Spotify', 'Sosyal Medya', 'Vlogging', 'YouTube', 'Sanal Gerçeklik', 'Memler', 'Metaverse', 'Podcastler', 'TikTok', 'Twitch', 'Netflix']
            },
            {
                title: 'Spor ve Fitness',
                icon: 'Dumbbell',
                options: ['Buz Hokeyi', 'Atıcılık', 'Atletizm', 'Spor', 'Yürüyüş', 'Plaj Sporları', 'Fitness Dersleri', 'Kaykay', 'Ragbi', 'Boks']
            }
        ]
    },
    step12: {
      title: 'Yeni fotoğraflarını ekle',
      description: 'Baştan aşağı tarzını ortaya koy. ({count}/6)',
      requirementText: 'En az 2 fotoğraf yüklemen gerekir.',
      button: 'Bitir',
      photoSlotLabels: [
          '', 
          'Boy fotoğrafı',
          'Gülümseyen',
          'Sosyal',
          'Yaşam Tarzı',
          'Poz vermeden'
      ],
  },
    errors: {
      dbConnectionError: 'Veritabanı bağlantısı kurulamadı.',
      signupFailed: 'Bir hata oluştu, lütfen tekrar deneyin.',
      uploadFailed: "'{fileName}' yüklenemedi.",
      photoUploadError: 'Fotoğraflar yüklenirken bir hata oluştu.',
      form: {
        email: 'Geçerli bir e-posta adresi girin.',
        password: 'Şifre en az 6 karakter olmalıdır.',
        name: 'İsim en az 2 karakter olmalıdır.',
        gender: 'Lütfen cinsiyetini seç.',
        lookingFor: 'Lütfen birini seç.',
        interests: 'En fazla 10 ilgi alanı seçebilirsin.',
        photos: 'En az 2 fotoğraf yüklemelisin.'
      }
    }
  },
  anasayfa: {
    outOfProfilesTitle: 'Herkes Tükendi!',
    outOfProfilesDescription: 'Çevrendeki tüm profilleri gördün. Daha sonra tekrar kontrol et.',
    matchToastTitle: 'Harika! Yeni bir eşleşme!',
    matchToastDescription: 'Hemen bir mesaj göndererek sohbeti başlat.',
    resetToastTitle: 'Profiller bitti!',
    resetToastDescription: 'Yeniden başlıyoruz.',
    distance: '{distance} km uzakta'
  },
  begeniler: {
    title: 'Seni Beğenenler',
    noLikesTitle: 'Henüz Beğeni Yok',
    noLikesDescription: 'Seni beğenen kişiler burada görünecek.',
  },
  eslesmeler: {
    title: 'Sohbetler',
    noChatsTitle: 'Henüz Sohbetin Yok',
    noChatsDescription: 'Eşleştiğin kişilerle sohbetlerin burada görünecek.',
    defaultMessage: 'Eşleştiniz! Bir merhaba de.',
    user: 'Kullanıcı'
  },
  kesfet: {
    commentsTitle: 'Yorumlar',
    likes: '{count} beğenme',
    viewAllComments: '{count} yorumun tümünü gör',
    translation: {
      translating: 'Çevriliyor...',
      seeTranslation: 'Çevirisine bak',
      seeOriginal: 'Orijinalini gör',
      translationFailed: 'Çeviri başarısız oldu:'
    }
  },
  profil: {
    title: 'Profil',
    user: 'BeMatch Kullanıcısı',
    verified: 'Doğrulanmış',
    editGallery: 'Galerini Düzenle',
    tryDoubleDate: 'Çifte Randevu\'yu dene',
    tryDoubleDateDesc: 'Arkadaşlarını davet et ve diğer çiftleri bul.',
    superLikes: '{count} Super Like',
    getMore: 'DAHA FAZLA AL',
    myBoosts: 'Boost\'larım',
    subscriptions: 'Abonelikler',
    goldTitle: 'BeMatch GOLD',
    features: 'Özellikler',
    free: 'Ücretsiz',
    gold: 'Gold',
    featureSeeLikes: 'Seni Kimlerin Beğendiğini Gör',
    featureTopPicks: 'En Seçkin Profiller',
    featureFreeSuperLikes: 'Ücretsiz Super Like\'lar',
    viewAllFeatures: 'Tüm Özellikleri Gör',
    logout: 'Güvenli Çıkış Yap',
    upgrade: 'YÜKSELT'
  },
  ayarlar: {
    title: 'Ayarlar ve Profil',
    groups: {
      account: 'Hesap Ayarları',
      privacy: 'Gizlilik ve Güvenlik',
      support: 'Destek ve Hakkında',
      exit: 'Uygulamadan Çık'
    },
    items: {
      personalInfo: 'Kişisel Bilgiler',
      gallery: 'Galeri Yönetimi',
      location: 'Konum',
      notifications: 'Bildirim Ayarları',
      accountPrivacy: 'Hesap Gizliliği',
      blockedUsers: 'Engellenen Kullanıcılar',
      helpCenter: 'Yardım Merkezi',
      communityRules: 'Topluluk Kuralları',
      termsOfUse: 'Kullanım Koşulları',
    },
    toasts: {
      pictureUpdatedTitle: 'Profil Resmi Güncellendi',
      pictureUpdatedDesc: 'Yeni profil resminiz başarıyla kaydedildi.',
      uploadFailedTitle: 'Yükleme Başarısız',
      uploadFailedDesc: 'Resim yüklenirken bir hata oluştu: {error}',
      logoutSuccessTitle: 'Çıkış Yapıldı',
      logoutSuccessDesc: 'Başarıyla çıkış yaptınız.',
      logoutErrorTitle: 'Çıkış Hatası',
      logoutErrorDesc: 'Çıkış yapılırken bir hata oluştu.'
    }
  },
  ayarlarPersonalInfo: {
    title: 'Kişisel Bilgiler',
    description: 'Profilinde görünecek temel bilgileri buradan düzenleyebilirsin.',
    nameLabel: 'Tam Adın',
    namePlaceholder: 'Adın ve Soyadın',
    bioLabel: 'Hakkında',
    bioPlaceholder: 'Kendinden kısaca bahset...',
    button: 'Değişiklikleri Kaydet',
    toasts: {
      successTitle: 'Profil Güncellendi',
      successDesc: 'Kişisel bilgileriniz başarıyla kaydedildi.',
      errorTitle: 'Güncelleme Başarısız',
      errorDesc: 'Bilgileriniz güncellenirken bir hata oluştu.',
    }
  },
  ayarlarGaleri: {
    title: 'Galeri Yönetimi',
    description: 'Profilinde gösterilecek fotoğraflarını buradan yönetebilirsin. En fazla 6 fotoğraf ekleyebilirsin. ({count}/6)',
    upload: 'Fotoğraf Ekle',
    deleteConfirmTitle: 'Fotoğrafı Silmek İstiyor musun?',
    deleteConfirmDescription: 'Bu işlem geri alınamaz. Bu fotoğraf galerinizden kalıcı olarak silinecektir.',
    toasts: {
      limitExceededTitle: 'Limit Aşıldı',
      limitExceededDesc: 'Galerinizde {count} fotoğraf var. En fazla {maxUploadCount} daha ekleyebilirsiniz.',
      uploading: 'Yükleniyor...',
      uploadSuccessTitle: 'Fotoğraflar Eklendi',
      uploadSuccessDesc: '{count} yeni fotoğraf galerinize eklendi.',
      uploadFailedTitle: 'Yükleme Başarısız',
      uploadFailedDesc: 'Bir veya daha fazla fotoğraf yüklenirken bir hata oluştu.',
      deleteFailedMinRequiredTitle: 'Silme Başarısız',
      deleteFailedMinRequiredDesc: 'Galerinizde en az 1 fotoğraf bulunmalıdır.',
      deleteSuccessTitle: 'Fotoğraf Silindi',
      deleteSuccessDesc: 'Fotoğraf galerinizden kaldırıldı.',
      deleteErrorTitle: 'Silme Başarısız',
      deleteErrorDesc: 'Fotoğraf silinirken bir hata oluştu.',
      saveSuccessTitle: 'Galeri Güncellendi',
      saveSuccessDesc: 'Fotoğraf değişiklikleriniz başarıyla kaydedildi.',
      saveErrorTitle: 'Kaydetme Başarısız',
      saveErrorDesc: 'Değişiklikler kaydedilirken bir hata oluştu.',
    }
  },
  ayarlarKonum: {
    title: 'Konum Yönetimi',
    description: 'Çevrendeki potansiyel eşleşmeleri görmek için konumunu güncel tut.',
    currentLocation: 'Yaklaşık Konumunuz',
    gettingAddress: 'Adres getiriliyor...',
    addressNotFound: 'Adres bilgisi alınamadı.',
    addressDetailNotFound: "Adres detayı bulunamadı.",
    locationMissingTitle: 'Konum Bilgisi Eksik',
    locationMissingDesc: 'Eşleşmeleri görebilmek için konum bilginizi eklemeniz gerekmektedir.',
    updateButton: 'Konumumu Güncelle',
    updatingButton: 'Konum Alınıyor...',
    errors: {
      permissionDenied: 'Konum izni reddedildi. Lütfen tarayıcı ayarlarınızı kontrol edin.',
      positionUnavailable: 'Konum bilgisi mevcut değil.',
      timeout: 'Konum alma isteği zaman aşımına uğradı.',
      dbSaveError: 'Konum veritabanına kaydedilemedi.',
      refNotFoundError: 'Kullanıcı profili referansı bulunamadı.'
    },
    toasts: {
        successTitle: 'Konum Güncellendi',
        successDesc: 'Yeni konumunuz başarıyla kaydedildi.',
    }
  },
  ayarlarBildirimler: {
    title: 'Bildirim Ayarları',
    description: 'Hangi durumlarda bildirim almak istediğini seç.',
    newMessages: 'Yeni Mesajlar',
    newMessagesDesc: 'Yeni bir mesaj aldığında anında haberdar ol.',
    newMatches: 'Yeni Eşleşmeler',
    newMatchesDesc: 'Biri seninle eşleştiğinde bildirim al.'
  },
  ayarlarGizlilik: {
      title: 'Hesap Gizliliği',
      description: 'Profilinin ve bilgilerinin nasıl görüneceğini yönet.',
      privateProfile: 'Gizli Profil',
      privateProfileDesc: 'Aktif edilirse profilin sadece eşleştiğin kişiler tarafından görülür.',
      hideActivity: 'Aktivite Durumunu Gizle',
      hideActivityDesc: 'Aktif olup olmadığını diğer kullanıcılardan gizle.'
  },
  ayarlarEngellenenler: {
    title: 'Engellenen Kullanıcılar',
    description: 'Burada engellediğin kullanıcıların listesini görebilirsin.',
    noBlockedUsersTitle: 'Henüz Kimseyi Engellemedin',
    noBlockedUsersDesc: 'Bir kullanıcıyı engellediğinde burada listelenir.'
  },
  ayarlarYardim: {
    title: 'Yardım Merkezi',
    description: 'Sorularına yanıt bulamadın mı? Yardım için buradayız.',
    searchPlaceholder: 'Aklındaki soru ne?',
    faqTitle: 'Sıkça Sorulan Sorular',
    faqs: [
        {
            question: 'Profilimi nasıl düzenlerim?',
            answer: 'Profil sayfanızdaki "Profili Düzenle" butonuna veya Ayarlar menüsündeki "Kişisel Bilgiler" seçeneğine tıklayarak bilgilerinizi güncelleyebilirsiniz.',
        },
        {
            question: 'Eşleşmelerimi nerede görebilirim?',
            answer: 'Alt navigasyon menüsündeki "Mesajlar" ikonuna tıklayarak tüm eşleşmelerinizi ve sohbetlerinizi görüntüleyebilirsiniz.',
        },
        {
            question: 'Bir kullanıcıyı nasıl engellerim?',
            answer: 'Kullanıcının profiline gidip sağ üst köşedeki üç nokta menüsünden "Engelle" seçeneğini seçebilirsiniz.',
        },
        {
            question: 'Aboneliğimi nasıl iptal ederim?',
            answer: 'Profil sayfanızdaki "Abonelikler" bölümünden mevcut aboneliğinizi yönetebilir ve iptal edebilirsiniz.',
        },
    ]
  },
  ayarlarTopluluk: {
      title: 'Topluluk Kuralları',
      description: 'BeMatch\'i herkes için güvenli ve pozitif bir yer olarak tutmamıza yardımcı ol.',
      rules: [
        'Herkese karşı saygılı ve nazik ol.',
        'Nefret söylemi, taciz ve zorbalığa tolerans göstermiyoruz.',
        'Çıplaklık, şiddet veya yasa dışı içerikler paylaşma.',
        'Spam yapma veya başkalarını yanıltmaya çalışma.',
        'Kendin ol ve gerçek bilgilerini paylaş.',
        'Diğer kullanıcıların sınırlarına saygı göster.',
      ]
  },
  ayarlarKullanim: {
      title: 'Kullanım Koşulları',
      lastUpdated: 'Son güncellenme tarihi: 31 Temmuz 2024',
      sections: [
        { title: '1. Giriş', content: 'BeMatch\'e hoş geldiniz ("Uygulama"). Bu Uygulama, kullanıcıların yeni insanlarla tanışmasını ve sosyal ilişkiler kurmasını sağlamak amacıyla tasarlanmıştır. Bu Kullanım Koşulları ("Koşullar"), Uygulamaya erişiminiz ve kullanımınız için geçerlidir.' },
        { title: '2. Hesap Oluşturma', content: 'Uygulamayı kullanmak için en az 18 yaşında olmanız ve yasal olarak bağlayıcı bir sözleşme yapma ehliyetine sahip olmanız gerekmektedir. Hesap oluştururken sağladığınız bilgilerin doğru, güncel ve eksiksiz olduğunu kabul edersiniz.' },
        { title: '3. Kullanıcı Davranışı', content: 'Topluluk Kurallarımıza uymayı kabul edersiniz. Taciz, nefret söylemi, yasa dışı faaliyetler veya diğer kullanıcıları rahatsız edici davranışlarda bulunmak kesinlikle yasaktır. Bu tür davranışlar hesabınızın askıya alınmasına veya sonlandırılmasına neden olabilir.' },
        { title: '4. İçerik', content: 'Uygulamada paylaştığınız tüm fotoğraf, metin ve diğer içeriklerin haklarına sahip olduğunuzu veya gerekli izinleri aldığınızı beyan edersiniz. Yasa dışı, müstehcen veya telif hakkıyla korunan materyalleri paylaşamazsınız. BeMatch, uygunsuz bulduğu içeriği kaldırma hakkını saklı tutar.' },
        { title: '5. Sorumluluğun Sınırlandırılması', content: 'Uygulama "olduğu gibi" sunulmaktadır. BeMatch, kullanıcılar arasındaki etkileşimlerden veya davranışlardan sorumlu tutulamaz. Çevrimdışı buluşmalarınızda kendi güvenliğinizden siz sorumlusunuz.' },
      ]
  },
  hukuki: {
      tos: {
          title: 'Kullanım Şartları',
          lastUpdated: 'Son Güncelleme: 1 Ağustos 2024',
          p1: 'BeMatch ("Uygulama") hizmetine hoş geldiniz. Bu Kullanım Şartları ("Şartlar"), Uygulamamıza erişiminizi ve kullanımınızı yönetir. Hizmetlerimizi kullanarak, bu Şartları kabul etmiş olursunuz.',
          h1: '1. Hesap Uygunluğu ve Sorumlulukları',
          p2: 'Hizmetlerimizi kullanmak için en az 18 yaşında olmalısınız. Hesabınızın güvenliğinden ve hesabınız altında gerçekleşen tüm aktivitelerden siz sorumlusunuz. Doğru ve güncel bilgiler vermeyi kabul edersiniz.',
          h2: '2. Kullanıcı Davranışı',
          p3: 'Topluluğumuzun tüm üyelerine saygılı davranmalısınız. Taciz, zorbalık, nefret söylemi veya herhangi bir yasa dışı veya uygunsuz davranışa tolerans gösterilmez. Bu tür davranışlar, hesabınızın derhal sonlandırılmasına neden olabilir.',
          h3: '3. İçerik Hakları ve Sorumlulukları',
          p4: 'Profilinize yüklediğiniz fotoğraflar, metinler ve diğer içerikler ("İçerik") sizin sorumluluğunuzdadır. İçeriğinizin haklarına sahip olduğunuzu veya gerekli izinleri aldığınızı beyan edersiniz. Müstehcen, şiddet içeren veya telif hakkıyla korunan materyalleri izinsiz paylaşamazsınız. BeMatch, bu kuralları ihlal eden içeriği kaldırma hakkını saklı tutar.',
          h4: '4. Sorumluluğun Sınırlandırılması',
          p5: 'Uygulama "olduğu gibi" sunulmaktadır. Diğer kullanıcılarla olan etkileşimlerinizden tamamen siz sorumlusunuz. BeMatch, kullanıcılar arasındaki davranışlardan veya çevrimdışı buluşmalardan kaynaklanan herhangi bir zarardan sorumlu tutulamaz.',
          h5: '5. Gizlilik',
          p6: 'Gizliliğiniz bizim için çok önemlidir. Verilerinizi nasıl topladığımızı ve kullandığımızı anlamak için lütfen Gizlilik Politikamızı dikkatlice okuyun. Hizmetlerimizi kullanarak, Gizlilik Politikamızı da kabul etmiş olursunuz. Her şey gizlidir ve verileriniz asla satılmaz.'
      },
      privacy: {
          title: 'Gizlilik Politikası',
          lastUpdated: 'Son Güncelleme: 1 Ağustos 2024',
          p1: 'BeMatch olarak gizliliğinize son derece önem veriyoruz. Bu Gizlilik Politikası, hizmetlerimizi kullandığınızda hangi bilgileri topladığımızı, bu bilgileri nasıl kullandığımızı ve koruduğumuzu açıklamaktadır.',
          h1: '1. Topladığımız Bilgiler',
          p2: '<strong>Profil Bilgileri:</strong> Adınız, e-posta adresiniz, doğum tarihiniz, cinsiyetiniz, fotoğraflarınız, ilgi alanlarınız ve biyografiniz gibi kayıt sırasında sağladığınız bilgiler.',
          p3: '<strong>Konum Bilgileri:</strong> Size yakın potansiyel eşleşmeleri göstermek için izninizle coğrafi konum bilgilerinizi toplarız.',
          p4: '<strong>Kullanım Verileri:</strong> Uygulama içindeki etkileşimleriniz (beğeniler, eşleşmeler, sohbetler) hakkında bilgi toplarız. Bu, hizmetimizi iyileştirmemize yardımcı olur.',
          h2: '2. Bilgilerinizi Nasıl Kullanıyoruz?',
          p5: 'Topladığımız bilgileri şu amaçlarla kullanırız:',
          list1: [
              'Size hizmetlerimizi sunmak ve yönetmek.',
              'Diğer kullanıcılarla eşleşmenizi sağlamak.',
              'Uygulamamızı kişiselleştirmek ve geliştirmek.',
              'Sizinle iletişim kurmak ve destek sağlamak.'
          ],
          h3: '3. Bilgilerin Paylaşımı',
          p6: '<strong>Her şey gizlidir.</strong> Kişisel bilgileriniz kesinlikle üçüncü taraflara satılmaz veya kiralanmaz. Bilgileriniz yalnızca profilinizin diğer kullanıcılar tarafından görülebilmesi gibi hizmetin temel işlevleri için kullanılır. Yasal bir zorunluluk olmadıkça verileriniz kimseyle paylaşılmaz.',
          h4: '4. Veri Güvenliği',
          p7: 'Kişisel bilgilerinizi korumak için endüstri standardı güvenlik önlemleri alıyoruz. Ancak, internet üzerinden hiçbir iletim yönteminin %100 güvenli olmadığını unutmamanız önemlidir.',
          h5: '5. Haklarınız',
          p8: 'Profil ayarlarınızdan bilgilerinize erişme, onları düzeltme veya silme hakkına sahipsiniz. Hesabınızı istediğiniz zaman silebilirsiniz.'
      },
      cookies: {
          title: 'Çerez Politikası',
          lastUpdated: 'Son Güncelleme: 1 Ağustos 2024',
          p1: 'Bu Çerez Politikası, BeMatch\'in ("biz", "bize" veya "bizim") web sitemizde ve mobil uygulamamızda çerezleri ve benzeri teknolojileri nasıl kullandığını açıklamaktadır.',
          h1: '1. Çerez Nedir?',
          p2: 'Çerezler, bir web sitesini ziyaret ettiğinizde cihazınıza (bilgisayar, tablet veya mobil) indirilen küçük metin dosyalarıdır. Çerezler, web sitelerinin çalışmasını veya daha verimli çalışmasını sağlamanın yanı sıra web sitesi sahiplerine bilgi sağlamak için yaygın olarak kullanılır.',
          h2: '2. Kullandığımız Çerez Türleri',
          p3: 'Uygulamamızın düzgün çalışması için yalnızca kesinlikle gerekli olan çerezleri kullanıyoruz. Bu çerezler, temel işlevleri yerine getirmemizi sağlar.',
          p4: '<strong>Oturum Çerezleri:</strong> Bu çerezler, oturumunuzu açık tutmak için gereklidir. Bu çerezler olmadan, her sayfada yeniden giriş yapmanız gerekirdi. Bu, hizmetimizin temel bir parçasıdır.',
          p5: '<strong>Güvenlik Çerezleri:</strong> Hesabınızı ve verilerinizi güvende tutmaya yardımcı olan çerezlerdir.',
          h3: '3. Pazarlama ve Analitik Çerezleri',
          p6: 'Şu anda pazarlama, reklam veya üçüncü taraf analitik çerezleri kullanmıyoruz. Gizliliğiniz bizim için önemlidir ve sizi gereksiz yere takip etmiyoruz. Politikamızda bir değişiklik olursa, bu sayfa güncellenecektir.',
          h4: '4. Çerezleri Yönetme',
          p7: 'Kullandığımız çerezler, hizmetimizin çalışması için zorunlu olduğundan, bunları devre dışı bırakma seçeneği sunmuyoruz. Bu çerezleri engellerseniz, uygulamanın bazı bölümleri beklendiği gibi çalışmayabilir.'
      }
  },
  footerNav: {
    home: 'Anasayfa',
    discover: 'Keşfet',
    likes: 'Beğeniler',
    chats: 'Sohbetler',
    profile: 'Profil',
  }
};
