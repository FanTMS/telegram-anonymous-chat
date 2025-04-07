import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createGroup, updateGroup, getGroupById } from '../../api/groups';
import {
    FormContainer,
    FormTitle,
    FormGroup,
    Label,
    Input,
    Textarea,
    TagInput,
    TagsContainer,
    Tag,
    RemoveTagButton,
    CheckboxContainer,
    Checkbox,
    ButtonsContainer,
    Button,
    ErrorMessage
} from './GroupForm.styles';

const GroupForm = ({ groupId, user, isEditMode }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        isPublic: true,
        isAnonymous: false,
        tags: []
    });
    const [tagInput, setTagInput] = useState('');
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const loadGroup = async () => {
            try {
                setLoading(true);
                const groupData = await getGroupById(groupId);

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

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

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

    const handleTagKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddTag();
        }
    };

    const handleRemoveTag = (tagToRemove) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagToRemove)
        }));
    };

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

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm() || submitting) {
            return;
        }

        try {
            setSubmitting(true);

            if (isEditMode) {
                await updateGroup(groupId, formData, user.id);
                navigate(`/groups/${groupId}`);
            } else {
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