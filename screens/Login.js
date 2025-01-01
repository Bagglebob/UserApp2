import { StyleSheet, Text, View, Button, FlatList, Image, Pressable, TextInput } from 'react-native';
import { useEffect, useState } from 'react';

// TODO: import the required service from FirebaseConfig.js
import { db, auth } from '../firebaseConfig'

// sign in function
import { signInWithEmailAndPassword } from "firebase/auth";

export default function Login({ navigation }){
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const loginPressed = async () => {
      console.log("Logging in...")
      try {
        // todo: write the code to create a user account
        // auth variable ...
        const userCredential
          = await signInWithEmailAndPassword(auth, email, password);
        //console.log(`loginPressed: Who is the currently logged in user? ${auth.currentUser.uid}`)
        //console.log(userCredential);
        navigation.navigate("SearchScreen");
      } catch (err) {
        console.log(err.message)
      }
    }

    return (
        <View style={styles.container}>
          <Text style={styles.title}>User Login</Text>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}           
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            // https://reactnative.dev/docs/textinput (secureTextEntry)
            secureTextEntry={true}
          />
          <Pressable style={styles.button} onPress={loginPressed}>
            <Text style={styles.buttonText}>Log In</Text>
          </Pressable>
         
        </View>
      );
}


const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      backgroundColor: '#f5f5f5',
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 20,
      color: '#333',
    },
    input: {
      width: '100%',
      padding: 15,
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 8,
      marginBottom: 15,
      backgroundColor: '#fff',
    },
    button: {
      backgroundColor: '#007BFF',
      paddingVertical: 15,
      paddingHorizontal: 25,
      borderRadius: 8,
      width: '100%',
      alignItems: 'center',
      marginTop: 10,
    },
    buttonText: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 16,
    },
    link: {
      color: '#007BFF',
      marginTop: 10,
      textDecorationLine: 'underline',
    },
  });