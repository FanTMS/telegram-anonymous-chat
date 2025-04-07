import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createGroup, getGroupById, updateGroup } from '../../services/groupService';
import { useAuth } from '../../hooks/useAuth';
import { 
    FormContainer, 
    FormTitle, 
    FormGroup, 
    Label, 
    Input, 
    Textarea, 
    CheckboxContainer, 
    Checkbox, 
    ErrorMessage, 
    ButtonsContainer, 
    Button, 
    TagsContainer, 
    TagInput, 
    Tag, 
    RemoveTagButton,
    Animations
} from './GroupForm.styles';

/**
 * Компонент формы создания/редактирования группы
 * @param {Object} props - Свойства компонента
 * @param {string} props.groupId - ID группы (для редактирования)
 */
const GroupForm = ({ groupId }) => {
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        isPublic: true,
        isAnonymous: false,
        tags: []
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [tagInput, setTagInput] = useState('');

    const navigate = useNavigate();
    const isEditMode = !!groupId;

    // Загрузка данных группы при редактировании
    useEffect(() => {
        const loadGroup = async () => {
            if (!isEditMode || !isAuthenticated) return;

            try {
                setLoading(true);
                const groupData = await getGroupById(groupId);

                if (!groupData) {
                    setErrors({ form: 'Группа не найдена' });
                    return;
                }

                const userMembership = groupData.members?.[user.id];
                if (!userMembership || userMembership.role !== 'admin') {
                    setErrors({ form: 'У вас нет прав для редактирования этой группы' });
                    return;
                }

                // Заполняем форму данными группы
                setFormData({
                    name: groupData.name || '',
                    description: groupData.description || '',
                    isPublic: groupData.isPublic !== undefined ? groupData.isPublic : true,
                    isAnonymous: groupData.isAnonymous !== undefined ? groupData.isAnonymous : false,
                    tags: groupData.tags || []
                });
            } catch (err) {
                console.error('Ошибка при загрузке данных группы:', err);
                setErrors({ form: err.message || 'Ошибка при загрузке данных группы' });
            } finally {
                setLoading(false);
            }
        };

        if (groupId && isAuthenticated) {
            loadGroup();
        }
    }, [groupId, user, isAuthenticated, isEditMode]);

    // Обработчик изменения полей формы
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        // Сбрасываем ошибку поля при его изменении
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    // Обработчик добавления тега
    const handleAddTag = () => {
        const trimmedTag = tagInput.trim();

        if (!trimmedTag) return;

        if (formData.tags.includes(trimmedTag)) {
            setErrors(prev => ({ ...prev, tags: 'Этот тег уже добавлен' }));
            return;
        }

        setFormData(prev => ({
            ...prev,
            tags: [...prev.tags, trimmedTag]
        }));

        setTagInput('');

        if (errors.tags) {
            setErrors(prev => ({ ...prev, tags: undefined }));
        }
    };

    // Обработчик нажатия Enter в поле тегов
    const handleTagKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddTag();
        }
    };

    // Обработчик удаления тега
    const handleRemoveTag = (tagToRemove) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagToRemove)
        }));
    };

    // Валидация формы
    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Название группы обязательно';
        } else if (formData.name.length < 3) {
            newErrors.name = 'Название должно содержать не менее 3 символов';
        } else if (formData.name.length > 50) {
            newErrors.name = 'Название должно содержать не более 50 символов';
        }

        if (formData.description && formData.description.length > 500) {
            newErrors.description = 'Описание должно содержать не более 500 символов';
        }

        if (formData.tags.length > 10) {
            newErrors.tags = 'Можно добавить не более 10 тегов';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Обработчик отправки формы
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm() || submitting || !isAuthenticated) {
            return;
        }

        try {
            setSubmitting(true);

            if (isEditMode) {
                // Обновление существующей группы
                await updateGroup(groupId, formData, user.id);
                navigate(`/groups/${groupId}`);
            } else {
                // Создание новой группы
                const newGroupId = await createGroup(formData, user.id);
                navigate(`/groups/${newGroupId}`);
            }
        } catch (err) {
            console.error('Ошибка при сохранении группы:', err);
            setErrors({ form: err.message || 'Ошибка при сохранении группы' });
        } finally {
            setSubmitting(false);
        }
    };

    // Обработчик отмены
    const handleCancel = () => {
        if (isEditMode) {
            navigate(`/groups/${groupId}`);
        } else {
            navigate('/groups');
        }
    };

    if (authLoading) {
        return (
            <FormContainer style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                <div>
                    <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                        <div className="loader"></div>
                    </div>
                    <div>Проверка авторизации...</div>
                </div>
            </FormContainer>
        );
    }

    if (!isAuthenticated) {
        return (
            <FormContainer>
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
                    <ErrorMessage style={{ justifyContent: 'center' }}>
                        Для создания или редактирования группы необходимо авторизоваться
                    </ErrorMessage>
                </div>
                <Button secondary="true" onClick={() => navigate('/')}>
                    Вернуться на главную
                </Button>
            </FormContainer>
        );
    }

    if (loading) {
        return (
            <FormContainer style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                <div>
                    <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                        <div className="loader"></div>
                    </div>
                    <div>Загрузка данных группы...</div>
                </div>
            </FormContainer>
        );
    }

    if (errors.form) {
        return (
            <FormContainer>
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
                    <ErrorMessage style={{ justifyContent: 'center' }}>{errors.form}</ErrorMessage>
                </div>
                <Button secondary="true" onClick={handleCancel}>Вернуться назад</Button>
            </FormContainer>
        );
    }

    return (
        <>
            <Animations />
            <FormContainer>
                <FormTitle>{isEditMode ? 'Редактирование группы' : 'Создание новой группы'}</FormTitle>

                <form onSubmit={handleSubmit}>
                    <FormGroup>
                        <Label htmlFor="name">Название группы*</Label>
                        <Input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Введите название группы"
                            maxLength={50}
                            autoComplete="off"
                        />
                        {errors.name && <ErrorMessage>{errors.name}</ErrorMessage>}
                    </FormGroup>

                    <FormGroup>
                        <Label htmlFor="description">Описание</Label>
                        <Textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Введите описание группы"
                            maxLength={500}
                        />
                        {errors.description && <ErrorMessage>{errors.description}</ErrorMessage>}
                        <div style={{ 
                            textAlign: 'right', 
                            fontSize: '13px', 
                            color: 'var(--tg-theme-hint-color, #999)', 
                            marginTop: '8px',
                            fontWeight: formData.description.length > 450 ? '500' : 'normal'
                        }}>
                            {formData.description.length}/500
                        </div>
                    </FormGroup>

                    <FormGroup>
                        <Label>Теги</Label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <TagInput
                                type="text"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={handleTagKeyDown}
                                placeholder="Добавить тег"
                                maxLength={20}
                                autoComplete="off"
                            />
                            <Button
                                type="button"
                                onClick={handleAddTag}
                                disabled={!tagInput.trim()}
                                style={{ 
                                    padding: '12px', 
                                    flex: 'none', 
                                    width: '44px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                +
                            </Button>
                        </div>

                        <TagsContainer>
                            {formData.tags.map(tag => (
                                <Tag key={tag}>
                                    {tag}
                                    <RemoveTagButton type="button" onClick={() => handleRemoveTag(tag)}>
                                        ✕
                                    </RemoveTagButton>
                                </Tag>
                            ))}
                        </TagsContainer>

                        {errors.tags && <ErrorMessage>{errors.tags}</ErrorMessage>}
                    </FormGroup>

                    <FormGroup>
                        <Label style={{ marginBottom: '12px' }}>Настройки группы</Label>
                        <CheckboxContainer>
                            <Checkbox
                                type="checkbox"
                                id="isPublic"
                                name="isPublic"
                                checked={formData.isPublic}
                                onChange={handleChange}
                            />
                            <Label htmlFor="isPublic" style={{ margin: 0 }}>
                                Публичная группа (видна всем)
                            </Label>
                        </CheckboxContainer>

                        <CheckboxContainer>
                            <Checkbox
                                type="checkbox"
                                id="isAnonymous"
                                name="isAnonymous"
                                checked={formData.isAnonymous}
                                onChange={handleChange}
                            />
                            <Label htmlFor="isAnonymous" style={{ margin: 0 }}>
                                Анонимная группа (участники с псевдонимами)
                            </Label>
                        </CheckboxContainer>
                    </FormGroup>

                    <ButtonsContainer>
                        <Button
                            type="submit"
                            disabled={submitting}
                        >
                            {submitting ? 'Сохранение...' : isEditMode ? 'Сохранить изменения' : 'Создать группу'}
                        </Button>
                        <Button
                            type="button"
                            onClick={handleCancel}
                            secondary="true"
                        >
                            Отмена
                        </Button>
                    </ButtonsContainer>
                </form>
            </FormContainer>
        </>
    );
};

export default GroupForm;