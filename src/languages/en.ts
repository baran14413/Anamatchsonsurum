
export const langEn = {
  common: {
    back: 'Back',
    save: 'Save',
    next: 'Next',
    nextDynamic: 'Next ({count}/{total})',
    loading: 'Loading...',
    done: 'Done',
    skip: 'Skip',
    error: 'Error',
    emailExistsTitle: 'Email Already Exists',
    emailExistsDescription: 'The email address you entered is already associated with an account. You are being redirected to the login page.',
    goToLogin: 'Login',
    editProfile: 'Edit Profile',
    logout: 'Logout',
    logoutConfirmTitle: 'Are you sure you want to log out?',
    logoutConfirmDescription: 'This action will log you out of your current session. You will need to log in again to access your account.',
    cancel: 'Cancel',
    delete: 'Delete',
    or: 'or',
    and: 'and',
  },
  welcome: {
    agreement: 'By tapping Sign In, you agree to our <1>Terms</1>. Learn how we process your data in our <3>Privacy Policy</3> and <5>Cookie Policy</5>.',
    continueWithGoogle: 'Continue with Google',
    continueWithEmail: 'Continue with Email',
    loginIssues: 'Trouble signing in?',
  },
  login: {
    title: 'Sign in with Email',
    emailStepTitle: "What's your email?",
    emailPlaceholder: 'Enter your email address',
    emailHint: 'Please enter the email address registered with the system, then you will be directed to the password step.',
    passwordStepTitle: 'Enter your password',
    passwordPlaceholder: 'Enter your password',
    change: 'Change',
    noAccount: "Don't have an account yet?",
    signupNow: 'Sign up now',
    errors: {
      authServiceError: 'Authentication service could not be loaded.',
      emailCheckError: 'There was a problem checking the email. Please try again.',
      emailNotRegistered: 'This email is not registered. Please sign up first.',
      invalidEmail: 'Invalid email address.',
      wrongPassword: 'Your password is incorrect. Please try again.',
    },
  },
  rules: {
    welcome: 'Welcome to BeMatch.',
    description: 'To help us build a great community, please remember to follow the rules below.',
    rule1Title: 'Be yourself.',
    rule1Desc: 'Make sure your photos, age, and bio are true to who you are.',
    rule2Title: 'Be kind.',
    rule2Desc: 'Respect other users and treat them as you would like to be treated.',
    rule3Title: 'Be careful.',
    rule3Desc: 'Think carefully before sharing personal information. Your safety is important to us.',
    rule4Title: 'Be proactive.',
    rule4Desc: 'Be sure to report any inappropriate behavior to keep our community safe.',
    agree: 'I Agree',
  },
  signup: {
    progressHeader: {
        skip: 'Skip',
    },
    common: {
        next: 'Next',
        nextDynamic: 'Next ({count}/{total})',
        emailExistsTitle: 'Email Already Exists',
        emailExistsDescription: 'The email address you entered is already associated with an account. You are being redirected to the login page.',
        goToLogin: 'Go to Login',
    },
    step1: {
      title: 'Create your account',
      description: 'Set your email and password to start the adventure.',
      emailLabel: 'Your Email Address',
      passwordLabel: 'Your Password',
    },
    step2: {
      title: "What's your name?",
      placeholder: 'Enter your name',
      label: 'This is how it will appear on your profile. You cannot change this later.',
    },
    step3: {
      title: 'What is your date of birth?',
      label: 'Your age will be shown on your profile, not your birth date.',
      dayPlaceholder: 'DD',
      monthPlaceholder: 'MM',
      yearPlaceholder: 'YYYY',
      errors: {
        minAge: 'You must be at least 18 years old.',
        invalidDate: 'Please enter a valid date.'
      }
    },
    step4: {
      title: 'I am a...',
      woman: 'Woman',
      man: 'Man',
    },
    step5: {
      title: 'What are you looking for?',
      label: "Don't worry, you can change this anytime from your profile.",
      options: [
        { id: 'long-term', label: 'Long-term relationship' },
        { id: 'short-term', label: 'Short-term relationship' },
        { id: 'friends', label: 'New friends' },
        { id: 'casual', label: 'Something casual' },
        { id: 'not-sure', label: "I'm not sure yet" },
        { id: 'whatever', label: 'Open to anything' },
      ],
    },
    step6: {
      title: 'Share Your Location',
      description: 'You need to share your location with us to see potential matches around you.',
      button: 'Share My Location',
      errorTitle: 'Location Permission Denied',
      errorMessage: 'Location permission is required to find matches. Please enable it in your browser settings.',
    },
    step7: {
      title: 'What is your distance preference?',
      description: 'Use the slider to set the maximum distance you want potential matches to be located.',
      label: 'Distance Preference',
      unit: 'Km',
      info: "You can change preferences later in Settings.",
    },
    step8: {
      title: 'If you want to add your school...',
      placeholder: 'Enter your school',
      label: 'This is how it will appear on your profile.',
    },
    step9: {
      title: '{name}, let\'s talk about your lifestyle habits',
      description: 'Are your habits compatible with your potential matches? You start first.',
      drinking: {
        question: 'How often do you drink?',
        options: [
          { id: 'not_for_me', label: 'Not for me' },
          { id: 'dont_drink', label: "I don't drink" },
          { id: 'rarely', label: 'Rarely' },
          { id: 'special_occasions', label: 'On special occasions' },
          { id: 'socially_weekends', label: 'Socially on weekends' },
          { id: 'most_nights', label: 'Most nights' },
        ],
      },
      smoking: {
        question: 'How often do you smoke?',
        options: [
          { id: 'social_smoker', label: 'Social smoker' },
          { id: 'with_drinks', label: 'When drinking' },
          { id: 'non_smoker', label: 'Non-smoker' },
          { id: 'smoker', label: 'Smoker' },
          { id: 'trying_to_quit', label: 'Trying to quit' },
        ],
      },
      workout: {
        question: 'Do you work out?',
        options: [
          { id: 'everyday', label: 'Every day' },
          { id: 'often', label: 'Often' },
          { id: 'sometimes', label: 'Sometimes' },
          { id: 'never', label: 'Never' },
        ],
      },
      pets: {
        question: 'Do you have pets?',
        options: [
          { id: 'dog', label: 'Dog' },
          { id: 'cat', label: 'Cat' },
          { id: 'reptile', label: 'Reptile' },
          { id: 'amphibian', label: 'Amphibian' },
          { id: 'bird', label: 'Bird' },
          { id: 'fish', label: 'Fish' },
          { id: 'none_but_love', label: 'No pets, but I love them' },
          { id: 'other', label: 'Other' },
          { id: 'turtle', label: 'Turtle' },
          { id: 'hamster', label: 'Hamster' },
          { id: 'rabbit', label: 'Rabbit' },
          { id: 'dont_like', label: "Don't like pets" },
          { id: 'all_pets', label: 'All pets' },
        ],
      },
    },
    step10: {
        title: '{name}, what else makes you, you?',
        description: "Don't be shy to express yourself. Authenticity is attractive.",
        communication: {
            question: 'How would you describe your communication style?',
            options: [
                { id: 'good_texter', label: 'I\'m a good texter' },
                { id: 'caller', label: 'I prefer to call' },
                { id: 'video_chat', label: 'Video chat is best' },
                { id: 'bad_texter', label: 'I\'m a bad texter' },
                { id: 'face_to_face', label: 'Better in person' },
            ],
        },
        loveLanguage: {
            question: 'How do you express love?',
            options: [
                { id: 'thoughtful_actions', label: 'Thoughtful actions' },
                { id: 'gifts', label: 'Gifts' },
                { id: 'touch', label: 'Physical touch' },
                { id: 'compliments', label: 'Words of affirmation' },
                { id: 'quality_time', label: 'Quality time' },
            ],
        },
        education: {
            question: 'What is your education level?',
            options: [
                { id: 'university_grad', label: 'University Graduate' },
                { id: 'bachelor_student', label: 'In College' },
                { id: 'high_school', label: 'High School' },
                { id: 'phd', label: 'PhD' },
                { id: 'master_student', label: 'In Grad School' },
                { id: 'master_grad', label: 'Graduate Degree' },
                { id: 'technical_school', label: 'Trade School' },
            ],
        },
        zodiac: {
            question: 'What is your zodiac sign?',
            options: [
                { id: 'capricorn', label: 'Capricorn' },
                { id: 'aquarius', label: 'Aquarius' },
                { id: 'pisces', label: 'Pisces' },
                { id: 'aries', label: 'Aries' },
                { id: 'taurus', label: 'Taurus' },
                { id: 'gemini', label: 'Gemini' },
                { id: 'cancer', label: 'Cancer' },
                { id: 'leo', label: 'Leo' },
                { id: 'virgo', label: 'Virgo' },
                { id: 'libra', label: 'Libra' },
                { id: 'scorpio', label: 'Scorpio' },
                { id: 'sagittarius', label: 'Sagittarius' },
            ],
        },
    },
    step11: {
        title: 'What are you interested in?',
        description: 'Add up to 10 interests to your profile to help you find people who share what you love.',
        categories: [
            {
                title: 'Music',
                icon: 'Music',
                options: [ 'Gospel', 'Bands', 'Rock', 'Soul', 'Pop', 'K-Pop', 'Punk', 'Rap', 'Folk', 'Latin', 'Alternative', 'Techno', 'Jazz', 'House', 'EDM', 'R&B', 'Indie', 'Opera', 'Heavy Metal', 'Funk', 'Reggaeton', 'Country', 'Hip Hop', 'J-Pop', 'Electronic', 'Grime', '90s Britpop', 'Trap', 'Music' ]
            },
            {
                title: 'Going Out',
                icon: 'DoorOpen',
                options: [ 'Escape Rooms', 'Bars', 'Thrifting', 'Museums', 'Raves', 'Drive-in Movies', 'Musicals', 'Cafe Hopping', 'Aquarium', 'Clubbing', 'Exhibitions', 'Shopping', 'Cars', 'Pub Quiz', 'Festivals', 'Happy Hour', 'Stand-up Comedy', 'Karaoke', 'House Parties', 'Theatre', 'Hookah', 'Skating', 'Live Music', 'Bar Hopping', 'Bowling', 'Motorcycles', 'Parties' ]
            },
            {
                title: 'Outdoors & Adventure',
                icon: 'Tent',
                options: [ 'Paddling', 'Scuba Diving', 'Jet Skiing', 'Walking Tours', 'Nature', 'Hot Springs', 'Dog Walking', 'Skiing', 'Canoeing', 'Snowboarding', 'Road Trips', 'Couchsurfing', 'Freediving', 'Travel', 'Stand-up Paddle', 'Surfing', 'Beach Bars', 'Paragliding', 'Sailing', 'Hiking', 'Mountains', 'Backpacking', 'Rock Climbing', 'Fishing', 'Camping', 'Outdoors', 'Picnics' ]
            },
            {
                title: 'Values & Causes',
                icon: 'Globe',
                options: [ 'Mental Health Awareness', 'Voter Rights', 'Climate Change', 'LGBTQIA+ Rights', 'Feminism', 'Black Lives Matter', 'Inclusivity', 'Human Rights', 'Social Development', 'Volunteering', 'Environmentalism', 'World Peace', 'Pride', 'Youth Empowerment', 'Equality', 'Politics', 'Activism', 'Disability Rights' ]
            },
            {
                title: 'Staying In',
                icon: 'Home',
                options: [ 'Reading', 'Binge-watching', 'Home Workouts', 'Trivia', 'Cooking', 'Online Games', 'Online Shopping', 'Gardening', 'Board Games', 'Baking' ]
            },
            {
                title: 'Fandoms',
                icon: 'Sparkles',
                options: [ 'Comic Con', 'Harry Potter', '90s Kid', 'NBA', 'MLB', 'Dungeons & Dragons', 'Manga', 'Marvel', 'Disney' ]
            },
             {
                title: 'TV & Movies',
                icon: 'Clapperboard',
                options: [ 'Action Movies', 'Animated Movies', 'Crime Shows', 'Drama Shows', 'Fantasy Movies', 'Documentaries', 'Indie Movies', 'Reality Shows', 'Rom-Coms', 'Sports Shows', 'Thrillers', 'K-Dramas', 'Horror Movies', 'Bollywood', 'Cinema', 'Sci-Fi', 'Anime', 'Comedy' ]
            },
            {
                title: 'Creativity',
                icon: 'Paintbrush',
                options: [ 'Crafts', 'Writing', 'Dancing', 'Painting', 'Design', 'Makeup' ]
            },
            {
                title: 'Gaming',
                icon: 'Gamepad2',
                options: [ 'PlayStation', 'Esports', 'Fortnite', 'Xbox', 'League of Legends', 'Nintendo', 'Among Us', 'Arcade', 'Roblox' ]
            },
            {
                title: 'Health & Lifestyle',
                icon: 'Sprout',
                options: [ 'Self Love', 'Trying New Things', 'Tarot', 'Spa', 'Personal Growth', 'Meditation', 'Skincare', 'Makeup', 'Astrology', 'Mindfulness', 'Sauna', 'Active Lifestyle', 'Yoga' ]
            },
             {
                title: 'Social Media',
                icon: 'MessageCircle',
                options: [ 'Instagram', 'X', 'SoundCloud', 'Pinterest', 'Spotify', 'Social Media', 'Vlogging', 'YouTube', 'Virtual Reality', 'Memes', 'Metaverse', 'Podcasts', 'TikTok', 'Twitch', 'Netflix' ]
            },
            {
                title: 'Sports & Fitness',
                icon: 'Dumbbell',
                options: [ 'Ice Hockey', 'Shooting', 'Track & Field', 'Sports', 'Walking', 'Beach Sports', 'Fitness Classes', 'Skateboarding', 'Rugby', 'Boxing' ]
            }
        ]
    },
    step12: {
        title: 'Add your new photos',
        description: 'Show off your style from head to toe.',
        requirementText: '2 photos required',
        button: 'Next',
        photoSlotLabels: [
            '', // First one is main, no label needed
            'Full body shot',
            'Smiling',
            'Social',
            'Lifestyle',
            'Candid'
        ],
    },
    errors: {
      dbConnectionError: 'Database connection could not be established.',
      signupFailed: 'An error occurred, please try again.',
      uploadFailed: "Failed to upload '{fileName}'.",
      photoUploadError: 'An error occurred while uploading photos.',
      form: {
        email: 'Please enter a valid email address.',
        password: 'Password must be at least 6 characters.',
        name: 'Name must be at least 2 characters.',
        gender: 'Please select your gender.',
        lookingFor: 'Please choose one.',
        interests: 'You can select up to 10 interests.',
        photos: 'You must upload at least 2 photos.'
      }
    }
  },
  anasayfa: {
    outOfProfilesTitle: "You're All Caught Up!",
    outOfProfilesDescription: "You've seen all the profiles in your area. Check back later for more.",
    matchToastTitle: "Great! It's a new match!",
    matchToastDescription: 'Start the conversation by sending a message now.',
    resetToastTitle: 'Out of profiles!',
    resetToastDescription: 'Starting over.',
    distance: '{distance} km away'
  },
  begeniler: {
    title: 'Likes',
    noLikesTitle: 'No Likes Yet',
    noLikesDescription: 'People who like you will appear here.',
  },
  eslesmeler: {
    title: 'Chats',
    noChatsTitle: 'No Chats Yet',
    noChatsDescription: 'Your chats with people you match with will appear here.',
    defaultMessage: "You've matched! Say hi.",
    user: 'User'
  },
  kesfet: {
    commentsTitle: 'Comments',
    likes: '{count} likes',
    viewAllComments: 'View all {count} comments',
    translation: {
      translating: 'Translating...',
      seeTranslation: 'See translation',
      seeOriginal: 'See original',
      translationFailed: 'Translation failed:'
    }
  },
  profil: {
    title: 'Profile',
    user: 'BeMatch User',
    verified: 'Verified',
    tryDoubleDate: 'Try Double Date',
    tryDoubleDateDesc: 'Invite your friends and find other pairs.',
    superLikes: '{count} Super Likes',
    getMore: 'GET MORE',
    myBoosts: 'My Boosts',
    subscriptions: 'Subscriptions',
    goldTitle: 'BeMatch GOLD',
    features: 'Features',
    free: 'Free',
    gold: 'Gold',
    featureSeeLikes: 'See Who Likes You',
    featureTopPicks: 'Top Picks',
    featureFreeSuperLikes: 'Free Super Likes',
    viewAllFeatures: 'View All Features',
    logout: 'Logout Securely'
  },
  ayarlar: {
    title: 'Settings & Profile',
    groups: {
      account: 'Account Settings',
      privacy: 'Privacy & Security',
      support: 'Support & About',
      exit: 'Exit Application'
    },
    items: {
      personalInfo: 'Personal Information',
      gallery: 'Gallery Management',
      location: 'Location',
      notifications: 'Notification Settings',
      accountPrivacy: 'Account Privacy',
      blockedUsers: 'Blocked Users',
      helpCenter: 'Help Center',
      communityRules: 'Community Rules',
      termsOfUse: 'Terms of Use',
    },
    toasts: {
      pictureUpdatedTitle: 'Profile Picture Updated',
      pictureUpdatedDesc: 'Your new profile picture has been saved successfully.',
      uploadFailedTitle: 'Upload Failed',
      uploadFailedDesc: 'An error occurred while uploading the image: {error}',
      logoutSuccessTitle: 'Logged Out',
      logoutSuccessDesc: 'You have successfully logged out.',
      logoutErrorTitle: 'Logout Error',
      logoutErrorDesc: 'An error occurred while logging out.'
    }
  },
  ayarlarPersonalInfo: {
    title: 'Personal Information',
    description: 'You can edit the basic information that will appear on your profile here.',
    nameLabel: 'Your Full Name',
    namePlaceholder: 'Your Name and Surname',
    bioLabel: 'About You',
    bioPlaceholder: 'Tell us a little about yourself...',
    button: 'Save Changes',
    toasts: {
      successTitle: 'Profile Updated',
      successDesc: 'Your personal information has been saved successfully.',
      errorTitle: 'Update Failed',
      errorDesc: 'An error occurred while updating your information.',
    }
  },
  ayarlarGaleri: {
    title: 'Gallery Management',
    description: 'Manage the photos that will be displayed on your profile screen here. You can add a minimum of 1 and a maximum of 9 photos. ({count}/9)',
    upload: 'Upload Photo',
    deleteConfirmTitle: 'Do you want to delete the photo?',
    deleteConfirmDescription: 'This action cannot be undone. This photo will be permanently deleted from your gallery.',
    toasts: {
      limitExceededTitle: 'Limit Exceeded',
      limitExceededDesc: 'You have {count} photos in your gallery. You can add up to {maxUploadCount} more photos.',
      uploading: 'Uploading...',
      uploadSuccessTitle: 'Photos Added',
      uploadSuccessDesc: '{count} new photos have been added to your gallery.',
      uploadFailedTitle: 'Upload Failed',
      uploadFailedDesc: 'An error occurred while uploading one or more photos.',
      deleteFailedMinRequiredTitle: 'Deletion Failed',
      deleteFailedMinRequiredDesc: 'You must have at least 1 photo in your gallery.',
      deleteSuccessTitle: 'Photo Deleted',
      deleteSuccessDesc: 'The photo has been removed from your gallery.',
      deleteErrorTitle: 'Deletion Failed',
      deleteErrorDesc: 'An error occurred while deleting the photo.',
    }
  },
  ayarlarKonum: {
    title: 'Location Management',
    description: 'Keep your location up-to-date to see potential matches around you.',
    currentLocation: 'Your Approximate Location',
    gettingAddress: 'Getting address...',
    addressNotFound: 'Address information could not be retrieved.',
    addressDetailNotFound: "Address detail not found.",
    locationMissingTitle: 'Location Information Missing',
    locationMissingDesc: 'You need to add your location information to see matches.',
    updateButton: 'Update My Location',
    updatingButton: 'Getting Location...',
    errors: {
      permissionDenied: 'Location permission denied. Please check your browser settings.',
      positionUnavailable: 'Location information is not available.',
      timeout: 'The request to get location timed out.',
      dbSaveError: 'Location could not be saved to the database.',
      refNotFoundError: 'User profile reference not found.'
    },
    toasts: {
        successTitle: 'Location Updated',
        successDesc: 'Your new location has been saved successfully.',
    }
  },
  ayarlarBildirimler: {
    title: 'Notification Settings',
    description: 'Choose when you want to receive notifications.',
    newMessages: 'New Messages',
    newMessagesDesc: 'Get notified instantly when you receive a new message.',
    newMatches: 'New Matches',
    newMatchesDesc: 'Get a notification when someone matches with you.'
  },
  ayarlarGizlilik: {
      title: 'Account Privacy',
      description: 'Manage how your profile and information appear.',
      privateProfile: 'Private Profile',
      privateProfileDesc: 'If enabled, your profile will only be visible to people you match with.',
      hideActivity: 'Hide Activity Status',
      hideActivityDesc: 'Hide whether you are active from other users.'
  },
  ayarlarEngellenenler: {
    title: 'Blocked Users',
    description: 'You can see the list of users you have blocked here.',
    noBlockedUsersTitle: 'You Haven\'t Blocked Anyone Yet',
    noBlockedUsersDesc: 'When you block a user, they will be listed here.'
  },
  ayarlarYardim: {
    title: 'Help Center',
    description: 'Couldn\'t find an answer to your questions? We\'re here to help.',
    searchPlaceholder: 'What\'s on your mind?',
    faqTitle: 'Frequently Asked Questions',
    faqs: [
        {
            question: 'How do I edit my profile?',
            answer: 'You can update your information by clicking the "Edit Profile" button on your profile page or the "Personal Information" option in the Settings menu.',
        },
        {
            question: 'Where can I see my matches?',
            answer: 'You can view all your matches and chats by clicking the "Messages" icon in the bottom navigation menu.',
        },
        {
            question: 'How do I block a user?',
            answer: 'You can go to the user\'s profile and select the "Block" option from the three-dot menu in the upper right corner.',
        },
        {
            question: 'How do I cancel my subscription?',
            answer: 'You can manage and cancel your current subscription from the "Subscriptions" section on your profile page.',
        },
    ]
  },
  ayarlarTopluluk: {
      title: 'Community Rules',
      description: 'Help us keep BeMatch a safe and positive place for everyone.',
      rules: [
        'Be respectful and kind to everyone.',
        'We do not tolerate hate speech, harassment, or bullying.',
        'Do not share nudity, violence, or illegal content.',
        'Do not spam or try to mislead others.',
        'Be yourself and share your real information.',
        'Respect other users\' boundaries.',
      ]
  },
  ayarlarKullanim: {
      title: 'Terms of Use',
      lastUpdated: 'Last updated: July 31, 2024',
      sections: [
        { title: '1. Introduction', content: 'Welcome to BeMatch ("Application"). This Application is designed to enable users to meet new people and form social relationships. These Terms of Use ("Terms") apply to your access and use of the Application.' },
        { title: '2. Account Creation', content: 'To use the Application, you must be at least 18 years old and have the legal capacity to enter into a binding contract. You agree that the information you provide when creating an account is accurate, current, and complete.' },
        { title: '3. User Conduct', content: 'You agree to abide by our Community Rules. Harassment, hate speech, illegal activities, or other disruptive behavior towards other users is strictly prohibited. Such behavior may result in the suspension or termination of your account.' },
        { title: '4. Content', content: 'You represent that you own the rights to or have obtained the necessary permissions for all photos, text, and other content you share on the Application. You may not share illegal, obscene, or copyrighted material. BeMatch reserves the right to remove any content it deems inappropriate.' },
        { title: '5. Limitation of Liability', content: 'The Application is provided "as is". BeMatch cannot be held responsible for interactions or conduct between users. You are responsible for your own safety during offline meetings.' },
      ]
  },
  hukuki: {
      tos: {
          title: 'Terms of Service',
          lastUpdated: 'Last Updated: August 1, 2024',
          p1: 'Welcome to the BeMatch ("Application") service. These Terms of Service ("Terms") govern your access to and use of our Application. By using our services, you agree to these Terms.',
          h1: '1. Account Eligibility and Responsibilities',
          p2: 'You must be at least 18 years old to use our services. You are responsible for the security of your account and all activities that occur under your account. You agree to provide accurate and up-to-date information.',
          h2: '2. User Conduct',
          p3: 'You must treat all members of our community with respect. Harassment, bullying, hate speech, or any illegal or inappropriate behavior will not be tolerated. Such behavior may result in the immediate termination of your account.',
          h3: '3. Content Rights and Responsibilities',
          p4: 'You are responsible for the photos, text, and other content ("Content") you upload to your profile. You represent that you own the rights to your Content or have obtained the necessary permissions. You may not share obscene, violent, or copyrighted material without permission. BeMatch reserves the right to remove content that violates these rules.',
          h4: '4. Limitation of Liability',
          p5: 'The Application is provided "as is". You are solely responsible for your interactions with other users. BeMatch is not liable for any damages arising from user conduct or offline meetings.',
          h5: '5. Privacy',
          p6: 'Your privacy is very important to us. Please read our Privacy Policy carefully to understand how we collect and use your data. By using our services, you also agree to our Privacy Policy. Everything is confidential, and your data is never sold.'
      },
      privacy: {
          title: 'Privacy Policy',
          lastUpdated: 'Last Updated: August 1, 2024',
          p1: 'At BeMatch, we take your privacy extremely seriously. This Privacy Policy explains what information we collect when you use our services, how we use and protect that information.',
          h1: '1. Information We Collect',
          p2: '<strong>Profile Information:</strong> Information you provide during registration, such as your name, email address, date of birth, gender, photos, interests, and bio.',
          p3: '<strong>Location Information:</strong> With your permission, we collect your geolocation data to show you potential matches nearby.',
          p4: '<strong>Usage Data:</strong> We collect information about your interactions within the app (likes, matches, chats). This helps us improve our service.',
          h2: '2. How We Use Your Information',
          p5: 'We use the information we collect to:',
          list1: [
              'Provide and manage our services to you.',
              'Enable you to match with other users.',
              'Personalize and improve our application.',
              'Communicate with you and provide support.'
          ],
          h3: '3. Information Sharing',
          p6: '<strong>Everything is confidential.</strong> Your personal information is absolutely not sold or rented to third parties. Your information is only used for the core functions of the service, such as making your profile visible to other users. Your data is not shared with anyone unless there is a legal obligation.',
          h4: '4. Data Security',
          p7: 'We take industry-standard security measures to protect your personal information. However, it is important to remember that no method of transmission over the Internet is 100% secure.',
          h5: '5. Your Rights',
          p8: 'You have the right to access, correct, or delete your information from your profile settings. You can delete your account at any time.'
      },
      cookies: {
          title: 'Cookie Policy',
          lastUpdated: 'Last Updated: August 1, 2024',
          p1: 'This Cookie Policy explains how BeMatch ("we", "us", or "our") uses cookies and similar technologies on our website and mobile application.',
          h1: '1. What are Cookies?',
          p2: 'Cookies are small text files that are downloaded to your device (computer, tablet, or mobile) when you visit a website. Cookies are widely used to make websites work, or work more efficiently, as well as to provide information to the owners of the site.',
          h2: '2. Types of Cookies We Use',
          p3: 'We only use strictly necessary cookies for our application to function properly. These cookies allow us to perform essential functions.',
          p4: '<strong>Session Cookies:</strong> These cookies are necessary to keep your session open. Without these cookies, you would have to log in again on every page. This is a fundamental part of our service.',
          p5: '<strong>Security Cookies:</strong> These are cookies that help keep your account and data secure.',
          h3: '3. Marketing and Analytics Cookies',
          p6: 'We do not currently use marketing, advertising, or third-party analytics cookies. Your privacy is important to us, and we do not track you unnecessarily. If our policy changes, this page will be updated.',
          h4: '4. Managing Cookies',
          p7: 'Since the cookies we use are mandatory for our service to work, we do not offer an option to disable them. If you block these cookies, parts of the application may not work as expected.'
      }
  },
  footerNav: {
    home: 'Home',
    discover: 'Discover',
    likes: 'Likes',
    chats: 'Chats',
    profile: 'Profile',
  }
};
