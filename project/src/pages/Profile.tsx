import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { User, Heart, FileText, LogOut, Loader } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Favorite, AdoptionRequest } from '../types';

export default function Profile() {
  const { user, signOut, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'favorites' | 'requests'>('favorites');
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [requests, setRequests] = useState<AdoptionRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    setLoading(true);

    const { data: favData } = await supabase
      .from('favorites')
      .select('*, pet:pets(*)')
      .eq('user_id', user!.id);
    if (favData) setFavorites(favData);

    const { data: reqData } = await supabase
      .from('adoption_requests')
      .select('*, pet:pets(*)')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });
    if (reqData) setRequests(reqData);

    setLoading(false);
  };

  const removeFavorite = async (petId: string) => {
    await supabase.from('favorites').delete().match({ user_id: user!.id, pet_id: petId });
    setFavorites(favorites.filter((f) => f.pet_id !== petId));
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    const labels: Record<string, string> = {
      pending: 'На рассмотрении',
      approved: 'Одобрено',
      rejected: 'Отклонено',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-8">
          <div className="flex items-center gap-4">
            <div className="bg-white p-3 rounded-full">
              <User className="w-8 h-8 text-amber-500" />
            </div>
            <div className="text-white">
              <h1 className="text-2xl font-bold">Личный кабинет</h1>
              <p className="text-amber-100">{user.email}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('favorites')}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-medium transition-colors ${
              activeTab === 'favorites'
                ? 'text-amber-600 border-b-2 border-amber-500'
                : 'text-gray-600 hover:text-amber-600'
            }`}
          >
            <Heart className="w-5 h-5" />
            Избранное ({favorites.length})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-medium transition-colors ${
              activeTab === 'requests'
                ? 'text-amber-600 border-b-2 border-amber-500'
                : 'text-gray-600 hover:text-amber-600'
            }`}
          >
            <FileText className="w-5 h-5" />
            Заявки ({requests.length})
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader className="w-8 h-8 animate-spin text-amber-500" />
            </div>
          ) : activeTab === 'favorites' ? (
            favorites.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Список избранного пуст</h3>
                <p className="text-gray-600 mb-4">Добавьте питомцев в избранное, чтобы они появились здесь</p>
                <Link
                  to="/pets"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors font-medium"
                >
                  Найти питомца
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {favorites.map((fav) => (
                  <div key={fav.id} className="group relative bg-gray-50 rounded-xl overflow-hidden">
                    <Link to={`/pets/${fav.pet_id}`} className="block">
                      <div className="aspect-square">
                        <img
                          src={fav.pet?.image_url}
                          alt={fav.pet?.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900">{fav.pet?.name}</h3>
                        <p className="text-sm text-gray-600">{fav.pet?.breed}</p>
                      </div>
                    </Link>
                    <button
                      onClick={() => removeFavorite(fav.pet_id)}
                      className="absolute top-2 right-2 p-2 bg-white rounded-full shadow hover:bg-red-50 hover:text-red-500 transition-colors"
                    >
                      <Heart className="w-5 h-5 fill-current" />
                    </button>
                  </div>
                ))}
              </div>
            )
          ) : requests.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Нет отправленных заявок</h3>
              <p className="text-gray-600 mb-4">Ваши заявки на усыновление появятся здесь</p>
              <Link
                to="/pets"
                className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors font-medium"
              >
                Найти питомца
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((req) => (
                <div
                  key={req.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <Link to={`/pets/${req.pet_id}`} className="flex-shrink-0">
                    <img
                      src={req.pet?.image_url}
                      alt={req.pet?.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/pets/${req.pet_id}`} className="block">
                      <h3 className="font-semibold text-gray-900 hover:text-amber-600 transition-colors">
                        {req.pet?.name}
                      </h3>
                      <p className="text-sm text-gray-600">{req.pet?.breed}</p>
                    </Link>
                    {req.message && (
                      <p className="text-sm text-gray-500 mt-1 truncate">{req.message}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {getStatusBadge(req.status)}
                    <p className="text-xs text-gray-400">
                      {new Date(req.created_at).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 flex justify-center">
        <button
          onClick={signOut}
          className="flex items-center gap-2 px-6 py-3 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium"
        >
          <LogOut className="w-5 h-5" />
          Выйти из аккаунта
        </button>
      </div>
    </div>
  );
}
