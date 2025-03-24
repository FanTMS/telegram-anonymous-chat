import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import WebApp from '@twa-dev/sdk'
import { AnimatePresence, motion } from 'framer-motion'
import { User, getCurrentUser, saveUser } from '../utils/user'
import { getUserPurchases, AvatarItem } from '../utils/store'
import Confetti from 'react-confetti'
// Закомментируем эту строку и используем собственную функцию для определения размера окна
// import { useWindowSize } from 'react-use'
import { InterestsSelector } from '../components/InterestsSelector'
import { availableInterests } from '../utils/interests'

// Добавим собственную функцию useWindowSize
const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
};

const safeWebApp = {
  showPopup: (params: any) => {
    try {
      if (WebApp && typeof WebApp.showPopup === 'function') {
        WebApp.showPopup(params);
      } else {
        console.log('WebApp.showPopup не поддерживается:', params);
        alert(params.message || 'Сообщение WebApp');
      }
    } catch (error) {
      console.error('Ошибка при вызове WebApp.showPopup:', error);
      alert(params.message || 'Сообщение WebApp');
    }
  },
  getColorScheme: () => {
    try {
      if (WebApp && WebApp.colorScheme) {
        return WebApp.colorScheme;
      }
    } catch (error) {
      console.error('Ошибка при получении WebApp.colorScheme:', error);
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
};

interface StatItemProps {
  label: string;
  value: string | number;
  icon: string;
}

const StatItem: React.FC<StatItemProps> = ({ label, value, icon }) => (
  <div className="flex flex-col items-center bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
    <div className="text-xl mb-1">{icon}</div>
    <div className="text-lg font-bold">{value}</div>
    <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
  </div>
);

interface InterestBadgeProps {
  interest: string;
  onRemove?: () => void;
  isEditing?: boolean;
}

const InterestBadge: React.FC<InterestBadgeProps> = ({ interest, onRemove, isEditing = false }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.8 }}
    className="flex items-center bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-3 py-1.5 rounded-full text-sm"
  >
    {interest}
    {isEditing && onRemove && (
      <button
        onClick={onRemove}
        className="ml-2 text-blue-800 dark:text-blue-200 hover:text-red-500 dark:hover:text-red-400 transition-colors"
      >
        ✕
      </button>
    )}
  </motion.div>
);

export const Profile = () => {
  const navigate = useNavigate();
  const { width, height } = useWindowSize();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [avatars, setAvatars] = useState<AvatarItem[]>([]);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        setLoading(true);
        const currentUser = getCurrentUser();

        if (!currentUser) {
          navigate('/registration');
          return;
        }

        setUser(currentUser);
        setDisplayName(currentUser.name || '');
        setBio(currentUser.bio || '');
        setInterests(currentUser.interests || []);
        setSelectedAvatar(currentUser.avatar || null);

        try {
          const purchases = getUserPurchases(currentUser.id) || [];
          const avatarPurchases = purchases
            .filter(p => p && typeof p === 'object' && 'itemType' in p && p.itemType === 'avatar' && 'itemData' in p)
            .map(p => (p as any).itemData as AvatarItem);

          setAvatars(avatarPurchases || []);
        } catch (purchaseError) {
          console.error('Ошибка при загрузке аватаров:', purchaseError);
          setAvatars([]);
        }
      } catch (error) {
        console.error('Ошибка при загрузке профиля:', error);
        setError('Не удалось загрузить профиль');
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, [navigate]);

  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      if (!displayName.trim()) {
        safeWebApp.showPopup({
          title: 'Ошибка',
          message: 'Имя не может быть пустым',
          buttons: [{ type: 'ok' }]
        });
        return;
      }

      const updatedUser: User = {
        ...user,
        name: displayName,
        bio: bio,
        interests: interests,
        avatar: selectedAvatar,
        lastActive: Date.now()
      };

      const success = saveUser(updatedUser);

      if (success) {
        setUser(updatedUser);
        setIsEditing(false);
        setShowSuccessAnimation(true);

        setTimeout(() => setShowSuccessAnimation(false), 3000);
      } else {
        throw new Error('Не удалось сохранить профиль');
      }
    } catch (error) {
      console.error('Ошибка при сохранении профиля:', error);
      safeWebApp.showPopup({
        title: 'Ошибка',
        message: 'Не удалось сохранить профиль',
        buttons: [{ type: 'ok' }]
      });
    }
  };

  const handleGoToSettings = () => {
    navigate('/settings');
  };

  const renderAvatar = () => {
    const defaultAvatar = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";
    const avatarUrl = selectedAvatar || user?.avatar || defaultAvatar;

    return (
      <div className="relative group">
        <motion.div
          className="w-28 h-28 rounded-full overflow-hidden border-4 border-white dark:border-gray-800 shadow-lg mx-auto"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <img
            src={avatarUrl}
            alt="Профиль"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = defaultAvatar;
            }}
          />
        </motion.div>

        {isEditing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => document.getElementById('avatar-selector')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-white text-black p-2 rounded-full"
            >
              📷
            </button>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <div className="spinner mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Загрузка профиля...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <div className="text-red-500 mb-4 text-4xl">⚠️</div>
        <p className="text-red-500 font-medium mb-4">{error}</p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 tg-button rounded-xl"
        >
          Вернуться на главную
        </button>
      </div>
    );
  }

  return (
    <div className="tg-container pb-16">
      {showSuccessAnimation && width && height && (
        <Confetti
          width={width}
          height={height}
          numberOfPieces={150}
          recycle={false}
          colors={['#2196f3', '#4caf50', '#ff9800', '#e91e63', '#9c27b0']}
        />
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center"
      >
        <div className="w-full flex justify-between items-center mb-6">
          <h1 className="tg-header mb-0">Профиль</h1>
          <div className="flex space-x-2">
            {!isEditing ? (
              <>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-1.5 tg-button rounded-lg text-sm"
                >
                  Редактировать
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleGoToSettings}
                  className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg"
                >
                  ⚙️
                </motion.button>
              </>
            ) : (
              <>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSaveProfile}
                  className="px-3 py-1.5 tg-button rounded-lg text-sm"
                >
                  Сохранить
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setIsEditing(false);
                    if (user) {
                      setDisplayName(user.name || '');
                      setBio(user.bio || '');
                      setInterests(user.interests || []);
                      setSelectedAvatar(user.avatar || null);
                    }
                  }}
                  className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm"
                >
                  Отмена
                </motion.button>
              </>
            )}
          </div>
        </div>

        <div className="mb-6 text-center">
          {renderAvatar()}
          <div className="mt-3">
            {isEditing ? (
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="tg-input text-center font-bold text-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm"
                placeholder="Ваше имя"
              />
            ) : (
              <h2 className="text-xl font-bold mt-2">{user?.name}</h2>
            )}
          </div>
        </div>

        <div className="w-full mb-6 space-y-6">
          <div className="grid grid-cols-3 gap-2">
            <StatItem
              label="Рейтинг"
              value={typeof user?.rating === 'number' ? user.rating.toFixed(1) : '0'}
              icon="⭐"
            />
            <StatItem
              label="Чаты"
              value={typeof user?.chatCount === 'number' ? user.chatCount : 0}
              icon="💬"
            />
            <StatItem
              label="Друзья"
              value={Array.isArray(user?.friends) ? user.friends.length : 0}
              icon="👥"
            />
          </div>

          <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium mb-2">О себе</h3>
            {isEditing ? (
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="tg-input w-full resize-none border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm"
                rows={4}
                placeholder="Расскажите о себе..."
              />
            ) : (
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {user?.bio || 'Информация о себе не указана'}
              </p>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium mb-3">Интересы</h3>

            {isEditing ? (
              <div className="mb-3">
                <InterestsSelector
                  selectedInterests={interests}
                  onChange={(newInterests) => setInterests(newInterests)}
                  maxSelections={10}
                />
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <AnimatePresence>
                  {interests.length > 0 ? (
                    interests.map((interestId, index) => {
                      const interestInfo = availableInterests.find(i => i.id === interestId) ||
                        { name: interestId, icon: '🔖' };

                      return (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="flex items-center bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-3 py-1.5 rounded-full text-sm"
                        >
                          {interestInfo.icon && <span className="mr-1">{interestInfo.icon}</span>}
                          {interestInfo.name || interestId}
                        </motion.div>
                      );
                    })
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      Интересы не указаны
                    </p>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        {isEditing && (
          <div id="avatar-selector" className="bg-white dark:bg-gray-800 shadow-sm rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium mb-3">Мои аватары</h3>

            {avatars.length > 0 ? (
              <div className="grid grid-cols-4 gap-3">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`w-16 h-16 rounded-full overflow-hidden border-2 cursor-pointer ${selectedAvatar === null
                    ? 'border-blue-500 dark:border-blue-400'
                    : 'border-gray-300 dark:border-gray-600'
                    }`}
                  onClick={() => setSelectedAvatar(null)}
                >
                  <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-400">
                    <span className="text-xl">✕</span>
                  </div>
                </motion.div>

                {avatars.map((avatar) => (
                  <motion.div
                    key={avatar.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`w-16 h-16 rounded-full overflow-hidden border-2 cursor-pointer ${selectedAvatar === avatar.avatarUrl
                      ? 'border-blue-500 dark:border-blue-400'
                      : 'border-gray-300 dark:border-gray-600'
                      }`}
                    onClick={() => setSelectedAvatar(avatar.avatarUrl)}
                  >
                    <img
                      src={avatar.avatarUrl}
                      alt={avatar.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";
                      }}
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
          <div className="text-center py-4">
            <p className="text-gray-500 dark:text-gray-400 mb-3">
              У вас пока нет аватаров
            </p>
            <button
              onClick={() => navigate('/store')}
              className="tg-button-sm"
            >
              Перейти в магазин
            </button>
          </div>
        )}
      </div>
    )}
  </motion.div>
</div>
  );
};
