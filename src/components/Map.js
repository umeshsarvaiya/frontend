import React, { useEffect, useState, useRef } from "react";
import { Search, MapPin, Navigation, X, Loader2, AlertCircle } from "lucide-react";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const categoryIcons = {
  Electrician: "https://maps.google.com/mapfiles/ms/icons/yellow-dot.png",
  Plumber: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
  Carpenter: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
  Salon: "https://maps.google.com/mapfiles/ms/icons/purple-dot.png",
  Default: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
};

const professionsList = [
  "Electrician",
  "Plumber",
  "Carpenter",
  "Salon",
  "Cleaner",
  "Mechanic",
  "Painter",
  "Doctor"
];

export default function MapPage() {
  const [currentPosition, setCurrentPosition] = useState(null);
  const [providers, setProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [radius, setRadius] = useState(5000);
  const [directions, setDirections] = useState(null);
  const [profession, setProfession] = useState("");
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const userMarkerRef = useRef(null);
  const infoWindowRef = useRef(null);
  const directionsRendererRef = useRef(null);
  const autocompleteRef = useRef(null);
  const searchInputRef = useRef(null);

  const GOOGLE_MAPS_API_KEY = "AIzaSyCCRDdzC4-8aMliCT4at-LTN0bB12GwkA0";

  // Load Google Maps Script
  useEffect(() => {
    if (window.google && window.google.maps) {
      setScriptLoaded(true);
      return;
    }

    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      existingScript.onload = () => setScriptLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      console.log("Google Maps loaded successfully");
      setScriptLoaded(true);
    };
    script.onerror = () => {
      console.error("Failed to load Google Maps");
      toast.error("Failed to load Google Maps");
    };
    document.head.appendChild(script);
  }, []);

  // Get user current location
  useEffect(() => {
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const position = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        console.log("Location obtained:", position);
        setCurrentPosition(position);
        setLocationLoading(false);
      },
      (err) => {
        console.error("Location error:", err);
        toast("Unable to get your location. Please search for a location manually.");
        setLocationLoading(false);
        const defaultPos = { lat: 23.0225, lng: 72.5714 };
        setCurrentPosition(defaultPos);
      }
    );
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!scriptLoaded || !currentPosition || !mapRef.current || mapInstanceRef.current) return;

    console.log("Initializing map with position:", currentPosition);

    try {
      const map = new window.google.maps.Map(mapRef.current, {
        center: currentPosition,
        zoom: 13,
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: true,
      });

      mapInstanceRef.current = map;
      console.log("Map initialized successfully");

      // Create user marker
      userMarkerRef.current = new window.google.maps.Marker({
        position: currentPosition,
        map: map,
        title: "Your Location",
        label: {
          text: "You",
          color: "white",
          fontWeight: "bold",
        },
        icon: {
          url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
          scaledSize: new window.google.maps.Size(40, 40),
        },
      });

      // Initialize InfoWindow
      infoWindowRef.current = new window.google.maps.InfoWindow();

      // Initialize DirectionsRenderer
      directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
        map: map,
        polylineOptions: {
          strokeColor: "#2563eb",
          strokeWeight: 5,
        },
      });

      console.log("Map components initialized");
    } catch (err) {
      console.error("Error initializing map:", err);
      toast.error("Failed to initialize map: " + err.message);
    }
  }, [scriptLoaded, currentPosition]);

  // Initialize Autocomplete
  useEffect(() => {
    if (!scriptLoaded || !searchInputRef.current || autocompleteRef.current) return;

    console.log("Initializing autocomplete");

    try {
      const autocomplete = new window.google.maps.places.Autocomplete(
        searchInputRef.current,
        { types: ["geocode"] }
      );

      autocompleteRef.current = autocomplete;

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        console.log("Place selected:", place);
        
        if (place && place.geometry) {
          const newPos = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
          };
          setCurrentPosition(newPos);
          toast.error(null);
          
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setCenter(newPos);
            mapInstanceRef.current.setZoom(13);
          }
          if (userMarkerRef.current) {
            userMarkerRef.current.setPosition(newPos);
          }
        }
      });

      console.log("Autocomplete initialized");
    } catch (err) {
      console.error("Error initializing autocomplete:", err);
    }
  }, [scriptLoaded]);

  // Update markers when providers change
  useEffect(() => {
    if (!mapInstanceRef.current || !currentPosition || !scriptLoaded) return;

    console.log("Updating markers, providers count:", providers.length);

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add new markers
    providers.forEach((p, idx) => {
      const distance = getDistance(
        currentPosition.lat,
        currentPosition.lng,
        p.latitude,
        p.longitude
      );

      const marker = new window.google.maps.Marker({
        position: { lat: p.latitude, lng: p.longitude },
        map: mapInstanceRef.current,
        title: p.profession,
        icon: {
          url: categoryIcons[p.profession] || categoryIcons["Default"],
          scaledSize: new window.google.maps.Size(35, 35),
        },
      });

      const providerData = { ...p, distance };

      marker.addListener("click", () => {
        console.log("Marker clicked:", providerData);
        setSelectedProvider(providerData);
        showInfoWindow(providerData, marker);
      });

      markersRef.current.push(marker);
    });

    console.log("Markers updated");
  }, [providers, currentPosition, scriptLoaded]);

  // Calculate distance (in km)
  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(2);
  };

  // Show InfoWindow
  const showInfoWindow = (provider, marker) => {
    if (!infoWindowRef.current) return;

    const content = `
      <div style="padding: 8px; min-width: 200px; font-family: system-ui, -apple-system, sans-serif;">
        <h3 style="font-weight: bold; font-size: 18px; color: #111827; margin: 0 0 8px 0;">
          ${provider.profession}
        </h3>
        <div style="margin-bottom: 12px;">
          ${provider.name ? `<p style="font-size: 14px; color: #4b5563; margin: 4px 0;">
            <span style="font-weight: 500;">Name:</span> ${provider.name}
          </p>` : ''}
          <p style="font-size: 14px; color: #4b5563; margin: 4px 0;">
            <span style="font-weight: 500;">Location:</span> ${provider.city || 'N/A'}
          </p>
          <p style="font-size: 14px; color: #4b5563; margin: 4px 0;">
            <span style="font-weight: 500;">Distance:</span>
            <span style="font-weight: 600; color: #2563eb;"> ${provider.distance} km away</span>
          </p>
        </div>
        <button
          id="direction-btn-${provider._id}"
          style="width: 100%; background-color: #16a34a; color: white; padding: 8px 16px; border-radius: 8px; border: none; font-weight: 500; cursor: pointer; font-size: 14px;"
          onmouseover="this.style.backgroundColor='#15803d'"
          onmouseout="this.style.backgroundColor='#16a34a'"
        >
          Get Directions
        </button>
      </div>
    `;

    infoWindowRef.current.setContent(content);
    infoWindowRef.current.open(mapInstanceRef.current, marker);

    setTimeout(() => {
      const btn = document.getElementById(`direction-btn-${provider._id}`);
      if (btn) {
        btn.onclick = () => handleDirection(provider);
      }
    }, 100);
  };

  // Fetch providers
  const fetchProviders = async () => {
    if (!profession || !currentPosition) {
      toast.error("Please select a profession and ensure location is set");
      return;
    }
    
    console.log("Fetching providers:", { profession, currentPosition, radius });
    setLoading(true);
    toast.error(null);
    
    try {
      const apiUrl = "http://localhost:5000";
      const params = new URLSearchParams({
        profession,
        lat: currentPosition.lat.toString(),
        lng: currentPosition.lng.toString(),
        radius: radius.toString(),
      });
      
      const response = await fetch(`${apiUrl}/api/users/near?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Providers fetched:", data);
      setProviders(data);
      setSelectedProvider(null);
      clearDirections();
      
      if (data.length === 0) {
        toast.error("No providers found in this area. Try increasing the search radius.");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      toast.error("Failed to fetch providers. Please check your API connection.");
    } finally {
      setLoading(false);
    }
  };

  // Show route to provider
  const handleDirection = (provider) => {
    if (!window?.google?.maps || !directionsRendererRef.current) {
      toast.error("Google Maps API is not loaded properly");
      return;
    }

    console.log("Getting directions to:", provider);

    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
      {
        origin: currentPosition,
        destination: {
          lat: provider.latitude,
          lng: provider.longitude,
        },
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === "OK") {
          directionsRendererRef.current.setDirections(result);
          setDirections(result);
          console.log("Directions rendered");
        } else {
          console.error("Directions request failed:", status);
          toast.error("Unable to get directions. Please try again.");
        }
      }
    );
  };

  const clearDirections = () => {
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setDirections({ routes: [] });
    }
    setDirections(null);
  };

  const panToProvider = (p) => {
    const distance = getDistance(
      currentPosition.lat,
      currentPosition.lng,
      p.latitude,
      p.longitude
    );
    setSelectedProvider({ ...p, distance });
    
    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo({ lat: p.latitude, lng: p.longitude });
      mapInstanceRef.current.setZoom(15);
    }

    const markerIndex = providers.findIndex(provider => provider._id === p._id);
    const marker = markersRef.current[markerIndex];
    if (marker) {
      showInfoWindow({ ...p, distance }, marker);
    }
  };

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <header style={{ backgroundColor: 'white', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', borderBottom: '1px solid #e5e7eb', zIndex: 10 }}>
        <div style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: 0 }}>Find Service Providers</h1>
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              style={{ display: 'none', padding: '8px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer' }}
            >
              {showSidebar ? <X size={24} /> : <Search size={24} />}
            </button>
          </div>

          {/* Search Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', }}>
              <div style={{ flex: '1', minWidth: '150px', position: 'relative' }}>
                <MapPin style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} size={20} />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search your location..."
                  style={{ 
                    width: '50%', 
                    paddingLeft: '40px', 
                    paddingRight: '16px', 
                    paddingTop: '12px',
                    paddingBottom: '12px',
                    border: '1px solid #d1d5db', 
                    borderRadius: '8px',
                    outline: 'none',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ flex: '1', minWidth: '150px', position: 'relative' }}>
                <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} size={20} />
                <input
                  type="text"
                  list="professions"
                  placeholder="Select profession..."
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  style={{ 
                    width: '50%', 
                    paddingLeft: '40px', 
                    paddingRight: '16px', 
                    paddingTop: '12px',
                    paddingBottom: '12px',
                    border: '1px solid #d1d5db', 
                    borderRadius: '8px',
                    outline: 'none',
                    fontSize: '14px'
                  }}
                />
                <datalist id="professions">
                  {professionsList.map((p) => (
                    <option key={p} value={p} />
                  ))}
                </datalist>
              </div>

              <select
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                style={{ 
                  padding: '12px 16px',
                  border: '1px solid #d1d5db', 
                  borderRadius: '8px',
                  outline: 'none',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                <option value={1000}>Within 1 km</option>
                <option value={3000}>Within 3 km</option>
                <option value={5000}>Within 5 km</option>
                <option value={10000}>Within 10 km</option>
                <option value={20000}>Within 20 km</option>
              </select>

              <button
                onClick={fetchProviders}
                disabled={loading || !profession || !currentPosition}
                style={{ 
                  padding: '12px 24px',
                  backgroundColor: loading || !profession || !currentPosition ? '#d1d5db' : '#2563eb',
                  color: 'white',
                  borderRadius: '8px',
                  border: 'none',
                  fontWeight: '500',
                  cursor: loading || !profession || !currentPosition ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  whiteSpace: 'nowrap',
                  fontSize: '14px'
                }}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search size={20} />
                    Search
                  </>
                )}
              </button>
            </div>

            {/* Active Route Info */}
            {directions && (
              <div style={{ 
                padding: '12px',
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Navigation style={{ color: '#16a34a' }} size={20} />
                  <p style={{ fontSize: '14px', color: '#15803d', fontWeight: '500', margin: 0 }}>Route displayed on map</p>
                </div>
                <button
                  onClick={clearDirections}
                  style={{ 
                    color: '#15803d',
                    fontWeight: '500',
                    fontSize: '14px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Clear Route
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Map Container */}
      <div style={{ flex: 1, position: 'relative' }}>
        {locationLoading ? (
          <div style={{ 
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f3f4f6'
          }}>
            <div style={{ textAlign: 'center' }}>
              <Loader2 className="animate-spin" style={{ margin: '0 auto 16px', color: '#2563eb' }} size={48} />
              <p style={{ color: '#4b5563', fontWeight: '500' }}>Getting your location...</p>
            </div>
          </div>
        ) : !scriptLoaded ? (
          <div style={{ 
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f3f4f6'
          }}>
            <div style={{ textAlign: 'center' }}>
              <Loader2 className="animate-spin" style={{ margin: '0 auto 16px', color: '#2563eb' }} size={48} />
              <p style={{ color: '#4b5563', fontWeight: '500' }}>Loading map...</p>
            </div>
          </div>
        ) : (
          <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
        )}
      </div>

      {/* Providers List Sidebar (Mobile) */}
      {providers.length > 0 && (
        <div style={{ 
          backgroundColor: 'white',
          borderTop: '1px solid #e5e7eb',
          maxHeight: '192px',
          overflowY: 'auto',
          display: 'block'
        }}>
          <div style={{ padding: '16px' }}>
            <h3 style={{ fontWeight: '600', color: '#111827', marginBottom: '12px' }}>Providers Found</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {providers.map((p) => {
                const distance = getDistance(
                  currentPosition.lat,
                  currentPosition.lng,
                  p.latitude,
                  p.longitude
                );
                return (
                  <button
                    key={p._id}
                    onClick={() => panToProvider(p)}
                    style={{ 
                      width: '100%',
                      textAlign: 'left',
                      padding: '12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      backgroundColor: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <p style={{ fontWeight: '500', color: '#111827', margin: '0 0 4px 0' }}>{p.profession}</p>
                        <p style={{ fontSize: '14px', color: '#4b5563', margin: 0 }}>{p.city}</p>
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#2563eb' }}>
                        {distance} km
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>

      <>
      {/* Your App Components */}
      <ToastContainer
        position="top-right"
        autoClose={3000}     // Toast disappears after 3 sec
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        pauseOnHover
        draggable
        theme="colored"
      />
    </>
    </div>
  );
}