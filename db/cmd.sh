docker exec -it frontend  npm install react-leaflet@^4.2.0 leaflet@^1.9.3
docker exec -it frontend  npm install react-router-dom
docker exec -it frontend npm install recharts
docker exec -it frontend npm install lucide-react
docker exec -it frontend npm install firebase
docker create --name temp_front projet-cloud-frontend:latest
 docker cp temp_front:/app/node_modules ./frontend/
docker exec -it frontend  cp ./frontend/ /app/node_modules 
 docker rm temp_front
 
# pour mobile:

#  const docRef = doc(db_firestore, "blacklisted_users", userCredential.user.uid);
# const docSnap = await getDoc(docRef);
# if (docSnap.exists()) {
#     // L'utilisateur est bloqué dans ta liste synchronisée
#     alert("Accès refusé : Votre compte est suspendu.");
#     await auth.signOut();
# } else {
#     // Tout est OK
#     goToDashboard();
# }