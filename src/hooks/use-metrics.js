import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { query, where, getDocs, orderBy, collection } from 'firebase/firestore';

import { db } from 'src/utils/firebase';

import { setError, setMetrics, startLoading, setWeeklyStats } from 'src/store/slices/metricsSlice';

export function useMetrics() {
    const dispatch = useDispatch();

    useEffect(() => {
        const fetchMetrics = async () => {
            dispatch(startLoading());
            try {
                // Récupérer le nombre total d'utilisateurs
                const usersRef = collection(db, 'users');
                const usersSnapshot = await getDocs(usersRef);
                const totalUsers = usersSnapshot.size;

                // Récupérer le nombre total d'événements
                const eventsRef = collection(db, 'events');
                const eventsSnapshot = await getDocs(eventsRef);
                const totalEvents = eventsSnapshot.size;

                // Récupérer le nombre total de commandes
                const ordersRef = collection(db, 'orders');
                const ordersSnapshot = await getDocs(ordersRef);
                const totalOrders = ordersSnapshot.size;

                // Mettre à jour les métriques globales
                dispatch(setMetrics({
                    totalUsers,
                    totalEvents,
                    totalOrders,
                }));

                // Récupérer les statistiques hebdomadaires
                const oneWeekAgo = new Date();
                oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

                // Requêtes pour les statistiques hebdomadaires
                const weeklyUsersQuery = query(
                    usersRef,
                    where('createdAt', '>=', oneWeekAgo),
                    orderBy('createdAt', 'desc')
                );

                const weeklyEventsQuery = query(
                    eventsRef,
                    where('createdAt', '>=', oneWeekAgo),
                    orderBy('createdAt', 'desc')
                );

                const weeklyOrdersQuery = query(
                    ordersRef,
                    where('createdAt', '>=', oneWeekAgo),
                    orderBy('createdAt', 'desc')
                );

                // Exécuter les requêtes
                const [weeklyUsersSnap, weeklyEventsSnap, weeklyOrdersSnap] = await Promise.all([
                    getDocs(weeklyUsersQuery),
                    getDocs(weeklyEventsQuery),
                    getDocs(weeklyOrdersQuery),
                ]);

                // Formater les données pour les graphiques
                const formatWeeklyData = (snapshot) => {
                    const data = [];
                    snapshot.forEach((doc) => {
                        const docData = doc.data();
                        data.push({
                            date: docData.createdAt,
                            value: 1,
                        });
                    });
                    return data;
                };

                // Mettre à jour les statistiques hebdomadaires
                dispatch(setWeeklyStats({
                    users: formatWeeklyData(weeklyUsersSnap),
                    events: formatWeeklyData(weeklyEventsSnap),
                    orders: formatWeeklyData(weeklyOrdersSnap),
                }));

            } catch (error) {
                console.error('Erreur lors de la récupération des métriques:', error);
                dispatch(setError(error.message));
            }
        };

        fetchMetrics();
    }, [dispatch]);
}
