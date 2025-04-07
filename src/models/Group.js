/**
 * Модель данных для группы
 */
class Group {
    constructor(data = {}) {
        this.id = data.id || null;
        this.name = data.name || '';
        this.description = data.description || '';
        this.createdAt = data.createdAt || new Date().toISOString();
        this.createdBy = data.createdBy || null;
        this.isPublic = data.isPublic !== undefined ? data.isPublic : true;
        this.isAnonymous = data.isAnonymous !== undefined ? data.isAnonymous : false;
        this.members = data.members || {};
        this.memberCount = data.memberCount || 0;
        this.avatar = data.avatar || null;
        this.lastActivity = data.lastActivity || new Date().toISOString();
        this.tags = data.tags || [];
    }

    /**
     * Конвертирует объект в формат для сохранения в Firestore
     */
    toFirestore() {
        return {
            name: this.name,
            description: this.description,
            createdAt: this.createdAt,
            createdBy: this.createdBy,
            isPublic: this.isPublic,
            isAnonymous: this.isAnonymous,
            members: this.members,
            memberCount: this.memberCount,
            avatar: this.avatar,
            lastActivity: this.lastActivity,
            tags: this.tags
        };
    }

    /**
     * Создает экземпляр Group из документа Firestore
     * @param {DocumentSnapshot} doc - Документ Firestore
     * @returns {Group} Экземпляр модели Group
     */
    static fromFirestore(doc) {
        const data = doc.data();
        return new Group({
            id: doc.id,
            ...data
        });
    }
}

export default Group;
