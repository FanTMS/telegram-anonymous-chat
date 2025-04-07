import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import '../styles/AdminPanelWidget.css';

const AdminPanelWidget = () => {
    const navigate = useNavigate();
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    // Fetching user data from Firestore
                    const userDocRef = doc(db, 'users', user.uid);
                    const userDoc = await getDoc(userDocRef);
                    
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        setIsAdmin(userData.isAdmin === true);
                    } else {
                        setIsAdmin(false);
                    }
                } catch (error) {
                    console.error('Error fetching admin status:', error);
                    setIsAdmin(false);
                } finally {
                    setLoading(false);
                }
            } else {
                setIsAdmin(false);
                setLoading(false);
            }
        });
        
        return () => unsubscribe();
    }, []);

    if (loading || !isAdmin) return null;

    return (
        <div className="admin-panel-widget">
            <button 
                className="admin-panel-button"
                onClick={() => navigate('/admin')}
            >
                <i className="fas fa-shield-alt"></i>
                Панель администратора
            </button>
        </div>
    );
};

export default AdminPanelWidget; 