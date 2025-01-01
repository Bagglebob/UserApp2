import { StyleSheet, Text, View, TextInput, Button, Image,  SafeAreaView, Platform, StatusBar, Pressable } from "react-native";
import { useEffect, useState, useRef } from "react"

import { collection, getDocs, where, query, doc, updateDoc, getDoc } from "firebase/firestore"
import { auth, db } from '../firebaseConfig';
import { signOut } from "firebase/auth";

import * as Location from "expo-location"
import MapView, { Marker } from "react-native-maps"

// DEFAULT LOCATION
// 1600 Amphitheatre Parkway, Mountain View, CA 94043
// Mountain View California United States
export default function SearchScreen() {
    const [mapRegion, setMapRegion] = useState(null);
    const [userListings, setUserListings] = useState([]);
    const [geoCodedListings, setGeoCodedListings] = useState([]);
    const [selectedListing, setSelectedListing] = useState(null);


    const mapRef = useRef(null)

    useEffect(() => {
        const fetchData = async () => {
            await requestPermissions();
            await getUserLocation();
            //await getListings();
        };
        fetchData();
    }, []);

    useEffect(() => {
        console.log("Updated userListings:", userListings);
    }, [userListings]);

    const moveMap = (result) => {
        mapRef.current.animateToRegion({
            latitude: result.latitude,
            longitude: result.longitude,
            latitudeDelta: 0.1,
            longitudeDelta: 0.1
        })
    }

    const requestPermissions = async () => {
        try {
            const permissionsObject =
                await Location.requestForegroundPermissionsAsync()
            if (permissionsObject.status !== "granted") {
                alert("Permission denied or not provided")
            }
        } catch (err) {
            console.log(err)
        }
    }

    const getUserLocation = async () => {
        try {
            const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });

            moveMap(location.coords);
            const postalAddresses = await Location.reverseGeocodeAsync(location.coords, {})
            const result = postalAddresses[0]
            const userCity = result.city
            console.log("++++What is the user's city?")
            console.log(userCity)


            //------- 3. get the listings for the city
            const q = query(
                collection(db, "listings"),
                where("city", "==", userCity)        // TODO: later, replace this with the user's location ( // 37.3900° N, 122.0812° W)
            );
            const querySnapshot = await getDocs(q);

            let copy = [];
            querySnapshot.forEach(
                async (currDoc) => {
                    //const resultOfGeo = await doFwdGeocode(currDoc.data().address)
                    //console.log("[Result of Geocoding locations after get:]",resultOfGeo)

                    const listingFromDb = {
                        docId: currDoc.id,
                        // SET LAT AND LONG WHEN YOU CREATE LISTING IN OWNER APP
                        // latitude: resultOfGeo.latitude,
                        // longitude: resultOfGeo.longitude,
                        ...currDoc.data(),
                    }
                    //console.log("listing From DB: ",listingFromDb)                   
                    copy.push(listingFromDb)


                }
            )
            setMapRegion(location.coords)
            //------- 3. get the listings for the city END 
            setUserListings(copy);// update the state variable
            //console.log("User Listings: ", userListings)           
        } catch (err) {
            console.log("ERROR HERE:",err)
        }
    }

    const getListings = async () => {
        try {
            if (!auth.currentUser) {
                console.error("No user is currently logged in.");
                return;
            }

            const querySnapshot = await getDocs(collection(db, "listings"));

            let copy = [];
            querySnapshot.forEach(
                // for each document in the search results:
                (currDoc) => {
                    copy.push(currDoc.data());
                }
            )
            setUserListings(copy);

        } catch (err) {
            console.log(err)
        }
    }

    // converts the specified human readable address to coordinates
    const doFwdGeocode = async (address) => {
        try {
            const geocodedLocation = await Location.geocodeAsync(address);

            const result = geocodedLocation[0];

            return result;

        } catch (err) {
            console.log(err);
        }
    }


    const geocodeListings = async (listings) => {
        const geoListings = [];
        for (const listing of listings) {
            try {
                const result = await doFwdGeocode(listing.address);
                if (result) {
                    geoListings.push({ ...listing, latlng: [result.latitude, result.longitude] });
                } else {
                    geoListings.push(listing); // Retain original listing if geocoding fails
                }
            } catch (err) {
                console.log(`Error geocoding address for listing: ${listing.address}`, err);
                geoListings.push(listing); // Retain original listing on error
            }
        }

        setGeoCodedListings(geoListings);
        //console.log("GeoCodedListings: ", geoListings)
    };

    const showDetails = (listing) => {
        setSelectedListing(listing);
    }

    const mapMarkers = () => {
        if (userListings.length === 0) { return null };
        //console.log("Rendering markers with userListings: ", userListings);

        return (userListings.map((listing) => (
            <Marker
                // key is needed because each child in a list needs that id property
                key={listing.docId}
                coordinate={{
                    latitude: listing.latitude,
                    longitude: listing.longitude,
                }}
                title={listing.listingTitle}
            //description={listing.price.toFixed(2)}
            //onPress={() => showDetails(listing)}
            />
        )));
    }

    // CONTINUE HERE
    // trying to update listing with a user uid for booking
    const bookListing = async (listing) => {
        console.log(listing.listingTitle)
        try {
            const q = query(
                collection(db, "listings"),
                where("address", "==", listing.address)
            );
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach((doc) => {
                console.log("Document data:", doc.data());
            });
            const docRef = querySnapshot.docs[0].ref; // i dont remember where I found this. maybe in the firebase doc
            console.log(docRef)
            await updateDoc(docRef, { bookedBy: auth.currentUser.email });
            // added this to the alert
            alert("Booking successful! "+ listing.address+ "," +listing.city);
        } catch (err) {
            console.log(err)
        }
        // try {
        //     await updateDoc(doc(db, "listings", listing.address), {bookedBy: auth.currentUser.uid})
        //     alert("Update complete!")
        // } catch(err) {
        //     console.log(err)
        // }

    }





    // useEffect(() => {
    //     if (userListings.length > 0) {
    //         geocodeListings(userListings);
    //     }
    // }, [userListings]); 


    return (<>
        <MapView style={styles.map} ref={mapRef}>
            {userListings.map((listing) => (
                <Marker
                    // key is needed because each child in a list needs that id property
                    key={listing.docId}
                    coordinate={{
                        latitude: listing.latitude,
                        longitude: listing.longitude,
                    }}
                    title={listing.listingTitle}
                    description={"$" + listing.price.toString()}
                    onPress={() => showDetails(listing)}
                />
            ))}

            {/* <Marker key={`${mapRegion.latitude}-${mapRegion.longitude}`}
                coordinate={{
                    latitude: mapRegion.latitude,
                    longitude: mapRegion.longitude,
                }}
            //title={country.name}
            /> */}
        </MapView>

        {selectedListing && (
            <View style={styles.detailsView}>
                <Text style={styles.detailsText}>
                    {selectedListing.listingTitle}
                </Text>
                <Text style={styles.detailsText}>
                    Price: {"$" + selectedListing.price.toString()}
                </Text>
                <Text style={styles.detailsText}>
                    Address: {selectedListing.address}
                </Text>
                {/* <Text style={styles.detailsText}>
                    Owner: {selectedListing.uid}
                </Text> */}
                {/* added image as well, i just noticed that i needed it */}
                <Image style={{ height: 100, width: 100 }} source={{
                    uri: selectedListing.image,
                }} >

                </Image>
                <Button title={"Book"} onPress={() => { bookListing(selectedListing) }} />
            </View>
        )}
    </>);
}


// DEBUGGING PURPOSES
// useEffect(() => {
//     console.log("Map Region set to:", mapRegion);
// }, [mapRegion]);
// DEBUGGING PURPOSES

// useEffect(() => {
//     console.log("Map Region set to:", userListings);    
// }, [userListings])


// useEffect(() => {
//     requestPermissions();
//     getUserLocation();

// }, [])

// useEffect(() => {
// getListings();
// }, [])

const styles = StyleSheet.create({
    container: {
        flexDirection: "column",
        margin: "auto",
        alignItems: "center",
        // borderColor:"blue",
        // borderWidth:2
        marginVertical: 15,
    },

    map: {
        borderWidth: 1,
        borderColor: "black",
        height: 400,
    },
    detailsView: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        padding: 10,
        backgroundColor: 'white',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 5,
    },
    detailsText: {
        fontSize: 16,
        marginBottom: 5,
    },
});