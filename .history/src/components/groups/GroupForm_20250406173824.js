import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { createGroup, getGroupById, updateGroup } from '../../services/groupService';

// Стили компонента
const FormContainer = styled.div`
  max-width: 600px;
  margin: 0 auto;
  padding: 16px;
`;

const FormTitle = styled.h1`
  font-size: 20px;
  margin-bottom: 16px;
  text-align: center;
`;

const FormGroup = styled.div`
  margin-bottom: 16px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px;
  border: 1px solid var(--tg-theme-hint-color, rgba(0, 0, 0, 0.2));
  border-radius: 6px;
  background-color: var(--tg-theme-secondary-bg-color, #f0f0f0);
  color: var(--tg-theme-text-color, #000);

  &:focus {
    outline: none;
    border-color: var(--tg-theme-button-color, #2481cc);
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 10px;
  border: 1px solid var(--tg-theme-hint-color, rgba(0, 0, 0, 0.2));
  border-radius: 6px;
  background-color: var(--tg-theme-secondary-bg-color, #f0f0f0);
  color: var(--tg-theme-text-color, #000);
  min-height: 100px;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: var(--tg-theme-button-color, #2481cc);
  }
`;

const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 10px;
`;

const Checkbox = styled.input`
  margin-right: 10px;
`;

const ErrorMessage = styled.div`
  color: var(--tg-theme-destructive-color, #e53935);
  font-size: 14px;
  margin-top: 6px;
`;

const ButtonsContainer = styled.div`
  display: flex;
  gap: 16px;
  margin-top: 24px;
`;

const Button = styled.button`
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  text-align: center;
  
  background-color: ${props => props.secondary
        ? 'var(--tg-theme-hint-color, rgba(0, 0, 0, 0.2))'
        : 'var(--tg-theme-button-color, #2481cc)'};
  color: ${props => props.secondary
        ? 'var(--tg-theme-text-color, #000)'
        : 'var(--tg-theme-button-text-color, #fff)'};
  
  &:hover {
    opacity: 0.9;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
`;

const TagInput = styled.input`
  width: 120px;
  padding: 6px 10px;
  border: 1px solid var(--tg-theme-hint-color, rgba(0, 0, 0, 0.2));
  border-radius: 4px;
  background-color: var(--tg-theme-secondary-bg-color, #f0f0f0);
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: var(--tg-theme-button-color, #2481cc);
  }
`;

const Tag = styled.div`
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  background-color: var(--tg-theme-button-color, #2481cc);
  color: var(--tg-theme-button-text-color, #fff);
  border-radius: 4px;
  font-size: 14px;
  gap: 6px;
`;

const RemoveTagButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: inherit;
  opacity: 0.8;
  
  &:hover {
    opacity: 1;
  }
`;

/**
 * Компонент формы создания/редактирования группы
 * @param {Object} props - Свойства компонента
 * @param {string} props.groupId - ID группы (для редактирования)
 * @param {Object} props.user - Объект пользователя
 */
const GroupForm = ({ groupId, user }) => {
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
            if (!isEditMode) return;

            try {
                setLoading(true);
                const groupData = await getGroupById(groupId);

                if (!groupData) {
                    setErrors({ form: 'Группа не найдена' });
                    return;
                }

                // Проверяем права пользователя на редактирование
                const userMembership = groupData.members?.[user?.id];
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

        if (groupId && user?.id) {
            loadGroup();
        }
    }, [groupId, user?.id, isEditMode]);

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

        if (!validateForm() || submitting) {
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

    if (loading) {
        return <div>Загрузка данных группы...</div>;
    }

    if (errors.form) {
        return (
            <FormContainer>
                <ErrorMessage>{errors.form}</ErrorMessage>
                <Button secondary onClick={handleCancel}>Вернуться назад</Button>
            </FormContainer>
        );
    }

    return (
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
                    <div style={{ textAlign: 'right', fontSize: '12px', color: 'var(--tg-theme-hint-color, #999)', marginTop: '4px' }}>
                        {formData.description.length}/500
                    </div>
                </FormGroup>

                <FormGroup>
                    <Label>Теги</Label>
                    <div>
                        <TagInput
                            type="text"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={handleTagKeyDown}
                            placeholder="Добавить тег"
                            maxLength={20}
                        />
                        <Button
                            type="button"
                            onClick={handleAddTag}
                            disabled={!tagInput.trim()}
                            style={{ marginLeft: '8px', padding: '6px 12px' }}
                        >
                            Добавить
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
                        {isEditMode ? 'Сохранить изменения' : 'Создать группу'}
                    </Button>
                    <Button
                        type="button"
                        onClick={handleCancel}
                        secondary
                    >
                        Отмена
                    </Button>
                </ButtonsContainer>
            </form>
        </FormContainer>
    );
};

export default GroupForm;