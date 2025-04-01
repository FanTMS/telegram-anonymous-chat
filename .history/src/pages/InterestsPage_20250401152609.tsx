// ...existing code...

const handleSaveInterests = async () => {
  if (!auth.currentUser) return;

  setLoading(true);
  
  try {
    const userRef = doc(db, 'users', auth.currentUser.uid);
    await updateDoc(userRef, {
      interests: selectedInterests
    });
    
    toast({
      title: "Интересы сохранены",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
    
    // Перенаправляем на главную страницу
    navigate('/home');
  } catch (error) {
    console.error('Error updating interests:', error);
    toast({
      title: "Ошибка при сохранении",
      description: "Пожалуйста, попробуйте еще раз",
      status: "error",
      duration: 3000,
      isClosable: true,
    });
  }
  
  setLoading(false);
};

// ...existing code...
