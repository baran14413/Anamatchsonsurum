
export const langTr = {
  signup: {
    progressHeader: {
      skip: 'Atla',
    },
    step1: {
      title: 'Hesabını oluştur',
      description: 'Maceraya başlamak için e-posta ve şifreni belirle.',
      emailLabel: 'E-posta Adresin',
      passwordLabel: 'Şifren',
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
    },
    step4: {
      title: 'Ben bir...',
      woman: 'Kadın',
      man: 'Erkek',
    },
    step5: {
      title: 'Ne arıyorsun?',
      label: 'Merak etme, bunu daha sonra profilinden istediğin zaman değiştirebilirsin.',
      options: [
        { id: 'long-term', label: 'Uzun süreli ilişki' },
        { id: 'short-term', label: 'Kısa süreli ilişki' },
        { id: 'friends', label: 'Yeni arkadaşlar' },
        { id: 'casual', label: 'Takılmak için' },
        { id: 'not-sure', label: 'Emin değilim' },
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
          { id: 'dont_drink', label: 'İçmiyorum' },
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
          { id: 'dont_like', label: 'Hoşlanmam' },
          { id: 'all_pets', label: 'Tüm evcil hayvanlar' },
        ],
      },
    },
    step10: {
        title: '{name}, seni sen yapan başka neler var?',
        description: 'Kendini ortaya koymaktan çekinme. Özgün olmak cazibelidir.',
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
        description: 'Sevdiğin şeyleri paylaşan kişileri bulmana yardımcı olması için profiline 10 ilgi alanı ekle.',
        categories: [
            {
                title: 'Dışarı Çıkmak',
                icon: 'DoorOpen',
                options: [
                    'Kaçış odaları', 'Barlar', 'İkinci el alışveriş', 'Müzeler', 'Rave partileri', 'Arabalı sinema', 'Müzikal', 'Kafeden kafeye gezmek', 'Akvaryum', 'Kulüpte Partilemek', 'Sergi', 'Alışveriş', 'Arabalar', 'Pub Quiz', 'Festivaller', 'Happy hour', 'Stand up Komedi', 'Karaoke', 'Ev Partileri', 'Tiyatro', 'Nargile', 'Paten', 'Canlı Müzik', 'Barları Turlamak', 'Bowling', 'Motosikletler', 'Partiler'
                ]
            },
            {
                title: 'Açık hava ve macera',
                icon: 'Tent',
                options: [
                    'Kürek', 'Dalış', 'Jet ski', 'Yürüyüş turları', 'Doğa', 'Kaplıcalar', 'Köpek Gezdirme', 'Kayak', 'Kanoculuk', 'Snowboard', 'Yol Gezileri', 'Couchsurfing', 'Serbest Dalış', 'Seyahat', 'Kürek Sörfü', 'Sörf', 'Plaj Barları', 'Yamaç Paraşütü', 'Yelkencilik', 'Doğa Yürüyüşü', 'Dağlar', 'Sırt Çantasıyla Gezi', 'Kaya Tırmanışı', 'Balıkçılık', 'Kampçılık', 'Açık Hava', 'Piknik Yapmak'
                ]
            },
            {
                title: 'Değerler ve amaçlar',
                icon: 'Globe',
                options: [
                    'Mental Health Awareness', 'Seçmen Hakları', 'İklim Değişikliği', 'LGBTQIA+ Hakları', 'Feminizm', 'Black Lives Matter', 'Kapsayıcılık', 'İnsan Hakları', 'Sosyal Gelişim', 'Gönüllü İşler', 'Çevrecilik', 'Dünya Barışı', 'Pride', 'Gençliğin Güçlendirilmesi', 'Eşitlik', 'Politika', 'Aktivizm', 'Engelli Hakları'
                ]
            },
            {
                title: 'Evde takılmak',
                icon: 'Home',
                options: [
                    'Okumak', 'Peş Peşe Dizi İzlemek', 'Evde Spor Yapmak', 'Bilgi Yarışmaları', 'Yemek Pişirme', 'Online Oyunlar', 'Online alışveriş', 'Bahçıvanlık', 'Masa Üstü Oyunlar', 'Fırın Lezzetleri'
                ]
            },
            {
                title: 'Kurmaca evrenler',
                icon: 'Sparkles',
                options: [
                    'Çizgi roman fuarı', 'Harry Potter', "90'larda Çocuk Olmak", 'NBA', 'MLB', 'Dungeons & Dragons', 'Manga', 'Marvel', 'Disney'
                ]
            }
        ]
    },
    common: {
      next: 'İlerle',
      nextDynamic: 'Sonraki {count}/{total}',
      loading: 'Yükleniyor...',
      done: 'Bitir',
      tempToast: 'Şimdilik bu kadar!',
      tempToastDescription: 'Tasarım devam ediyor.',
      emailExistsTitle: 'E-posta Zaten Mevcut',
      emailExistsDescription: 'Girdiğiniz e-posta adresi zaten bir hesaba bağlı. Giriş sayfasına yönlendiriliyorsunuz.',
      goToLogin: 'Giriş Yap',
    },
  },
};
