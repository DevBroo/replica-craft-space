export interface LocationData {
  region: string;
  popularCities: string[];
  allCities: string[];
}

export const indianStates: Record<string, LocationData> = {
  "Andhra Pradesh": {
    region: "South",
    popularCities: ["Visakhapatnam", "Vijayawada", "Guntur", "Tirupati"],
    allCities: ["Visakhapatnam", "Vijayawada", "Guntur", "Tirupati", "Nellore", "Kurnool", "Rajahmundry", "Kadapa", "Kakinada", "Anantapur", "Eluru", "Ongole", "Chittoor", "Machilipatnam", "Adoni", "Tenali", "Proddatur", "Hindupur", "Bhimavaram", "Madanapalle"]
  },
  "Arunachal Pradesh": {
    region: "Northeast",
    popularCities: ["Itanagar", "Naharlagun", "Pasighat", "Tawang"],
    allCities: ["Itanagar", "Naharlagun", "Pasighat", "Tawang", "Ziro", "Bomdila", "Tezu", "Seppa", "Along", "Khonsa", "Namsai", "Changlang", "Aalo", "Roing", "Yingkiong"]
  },
  "Assam": {
    region: "Northeast",
    popularCities: ["Guwahati", "Silchar", "Dibrugarh", "Jorhat"],
    allCities: ["Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Nagaon", "Tinsukia", "Tezpur", "Barpeta", "Dhubri", "North Lakhimpur", "Karimganj", "Sivasagar", "Goalpara", "Bongaigaon", "Mangaldoi", "Diphu", "Haflong", "Hailakandi", "Morigaon", "Hojai"]
  },
  "Bihar": {
    region: "East",
    popularCities: ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur"],
    allCities: ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Darbhanga", "Bihar Sharif", "Arrah", "Begusarai", "Katihar", "Munger", "Chhapra", "Danapur", "Saharsa", "Sasaram", "Hajipur", "Dehri", "Siwan", "Motihari", "Nawada", "Bagaha", "Buxar", "Kishanganj", "Sitamarhi", "Jamalpur", "Jehanabad"]
  },
  "Chhattisgarh": {
    region: "Central",
    popularCities: ["Raipur", "Bhilai", "Korba", "Bilaspur"],
    allCities: ["Raipur", "Bhilai", "Korba", "Bilaspur", "Durg", "Rajnandgaon", "Jagdalpur", "Raigarh", "Ambikapur", "Mahasamund", "Dhamtari", "Chirmiri", "Bhatapara", "Dalli-Rajhara", "Naila Janjgir", "Tilda Newra", "Mungeli", "Manendragarh", "Sakti"]
  },
  "Goa": {
    region: "West",
    popularCities: ["Panaji", "Margao", "Vasco da Gama", "Mapusa"],
    allCities: ["Panaji", "Margao", "Vasco da Gama", "Mapusa", "Ponda", "Bicholim", "Curchorem", "Sanquelim", "Cuncolim", "Quepem", "Pernem", "Canacona", "Sanguem", "Aldona", "Arambol", "Anjuna", "Calangute", "Candolim", "Colva", "Baga"]
  },
  "Gujarat": {
    region: "West",
    popularCities: ["Ahmedabad", "Surat", "Vadodara", "Rajkot"],
    allCities: ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar", "Junagadh", "Gandhinagar", "Anand", "Navsari", "Morbi", "Nadiad", "Surendranagar", "Bharuch", "Mehsana", "Bhuj", "Porbandar", "Palanpur", "Vapi", "Godhra", "Patan", "Kalol", "Dahod", "Botad", "Amreli", "Deesa", "Jetpur"]
  },
  "Haryana": {
    region: "North",
    popularCities: ["Faridabad", "Gurgaon", "Panipat", "Ambala"],
    allCities: ["Faridabad", "Gurgaon", "Panipat", "Ambala", "Yamunanagar", "Rohtak", "Hisar", "Karnal", "Sonipat", "Panchkula", "Bhiwani", "Sirsa", "Bahadurgarh", "Jind", "Thanesar", "Kaithal", "Rewari", "Narnaul", "Pundri", "Kosli", "Palwal", "Hansi", "Maham", "Assandh"]
  },
  "Himachal Pradesh": {
    region: "North",
    popularCities: ["Shimla", "Manali", "Dharamshala", "Solan"],
    allCities: ["Shimla", "Manali", "Dharamshala", "Solan", "Mandi", "Palampur", "Baddi", "Nahan", "Paonta Sahib", "Sundarnagar", "Chamba", "Una", "Kullu", "Hamirpur", "Bilaspur", "Yol", "Jubbal", "Chail", "Kasauli", "Dalhousie", "Mcleodganj", "Kinnaur", "Spiti", "Lahaul"]
  },
  "Jharkhand": {
    region: "East",
    popularCities: ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro"],
    allCities: ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Deoghar", "Phusro", "Hazaribagh", "Medininagar", "Giridih", "Ramgarh", "Jhumri Telaiya", "Chirkunda", "Chaibasa", "Dumka", "Sahibganj", "Mihijam", "Pakaur", "Chas", "Barhi", "Kitadih", "Gumla", "Bundu", "Godda", "Simdega"]
  },
  "Karnataka": {
    region: "South",
    popularCities: ["Bangalore", "Mysuru", "Mangalore", "Hubli"],
    allCities: ["Bangalore", "Mysuru", "Mangalore", "Hubli", "Belagavi", "Gulbarga", "Davanagere", "Bellary", "Bijapur", "Shimoga", "Tumakuru", "Raichur", "Bidar", "Hospet", "Gadag-Betigeri", "Udupi", "Robertson Pet", "Bhadravati", "Chitradurga", "Hassan", "Mandya", "Chikkamagaluru", "Bagalkot", "Vijayapura", "Karwar", "Kolar", "Chikkaballapur", "Gokak", "Ranebennuru", "Gangavati", "Sirsi", "Sindhanur", "Kampli", "Rabkavi Banhatti", "Shorapur", "Nanjangud", "Kollegal", "Coorg", "Kodagu", "Hampi"]
  },
  "Kerala": {
    region: "South",
    popularCities: ["Kochi", "Thiruvananthapuram", "Kozhikode", "Thrissur"],
    allCities: ["Kochi", "Thiruvananthapuram", "Kozhikode", "Thrissur", "Kollam", "Palakkad", "Alappuzha", "Malappuram", "Kannur", "Kasaragod", "Kottayam", "Idukki", "Ernakulam", "Pathanamthitta", "Wayanad", "Munnar", "Thekkady", "Kumarakom", "Varkala", "Bekal", "Kovalam", "Alleppey", "Guruvayur", "Periyar", "Backwaters"]
  },
  "Ladakh": {
    region: "North",
    popularCities: ["Leh", "Kargil", "Nubra Valley", "Pangong"],
    allCities: ["Leh", "Kargil", "Nubra Valley", "Pangong", "Zanskar", "Drass", "Khardung La", "Turtuk", "Hunder", "Diskit", "Lamayuru", "Hemis", "Thiksey", "Shey", "Stakna", "Alchi", "Likir", "Phyang", "Spituk", "Chemrey"]
  },
  "Madhya Pradesh": {
    region: "Central",
    popularCities: ["Bhopal", "Indore", "Gwalior", "Jabalpur"],
    allCities: ["Bhopal", "Indore", "Gwalior", "Jabalpur", "Ujjain", "Sagar", "Dewas", "Satna", "Ratlam", "Rewa", "Murwara", "Singrauli", "Burhanpur", "Khandwa", "Bhind", "Chhindwara", "Guna", "Shivpuri", "Vidisha", "Chhatarpur", "Damoh", "Mandsaur", "Khargone", "Neemuch", "Pithampur", "Narmadapuram", "Seoni", "Balaghat", "Harda", "Betul", "Khajuraho", "Orchha", "Pachmarhi", "Sanchi", "Omkareshwar"]
  },
  "Maharashtra": {
    region: "West",
    popularCities: ["Mumbai", "Pune", "Nagpur", "Nashik"],
    allCities: ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad", "Solapur", "Amravati", "Kolhapur", "Sangli", "Malegaon", "Jalgaon", "Akola", "Latur", "Dhule", "Ahmednagar", "Chandrapur", "Parbhani", "Ichalkaranji", "Jalna", "Ambernath", "Bhusawal", "Panvel", "Badlapur", "Beed", "Gondia", "Satara", "Barshi", "Yavatmal", "Achalpur", "Osmanabad", "Nandurbar", "Wardha", "Udgir", "Hinganghat", "Lonavala", "Shirdi", "Alibaug", "Mahabaleshwar", "Matheran", "Ajanta", "Ellora"]
  },
  "Manipur": {
    region: "Northeast",
    popularCities: ["Imphal", "Thoubal", "Bishnupur", "Churachandpur"],
    allCities: ["Imphal", "Thoubal", "Bishnupur", "Churachandpur", "Kakching", "Ukhrul", "Senapati", "Tamenglong", "Jiribam", "Kangpokpi", "Tengnoupal", "Kamjong", "Noney", "Pherzawl", "Loktak", "Moreh", "Moirang"]
  },
  "Meghalaya": {
    region: "Northeast",
    popularCities: ["Shillong", "Tura", "Cherrapunji", "Mawlynnong"],
    allCities: ["Shillong", "Tura", "Cherrapunji", "Mawlynnong", "Jowai", "Baghmara", "Williamnagar", "Nongpoh", "Mawkyrwat", "Resubelpara", "Ampati", "Dawki", "Mairang", "Nongstoin", "Khliehriat", "Amlarem", "Sohra", "Mawsynram", "Elephant Falls", "Umiam Lake"]
  },
  "Mizoram": {
    region: "Northeast",
    popularCities: ["Aizawl", "Lunglei", "Saiha", "Champhai"],
    allCities: ["Aizawl", "Lunglei", "Saiha", "Champhai", "Kolasib", "Serchhip", "Mamit", "Lawngtlai", "Hnahthial", "Saitual", "Khawzawl", "Bairabi", "North Vanlaiphai", "Tlabung", "Demagiri"]
  },
  "Nagaland": {
    region: "Northeast",
    popularCities: ["Kohima", "Dimapur", "Mokokchung", "Tuensang"],
    allCities: ["Kohima", "Dimapur", "Mokokchung", "Tuensang", "Wokha", "Zunheboto", "Phek", "Kiphire", "Longleng", "Peren", "Mon", "Noklak", "Chumukedima", "Pfutsero", "Jalukie", "Tuli", "Changtongya"]
  },
  "Odisha": {
    region: "East",
    popularCities: ["Bhubaneswar", "Cuttack", "Rourkela", "Berhampur"],
    allCities: ["Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Sambalpur", "Puri", "Balasore", "Bhadrak", "Baripada", "Jharsuguda", "Jeypore", "Barbil", "Khordha", "Bolangir", "Sundargarh", "Phulbani", "Kendujhar", "Nabarangpur", "Rayagada", "Koraput", "Angul", "Dhenkanal", "Jajpur", "Kendrapara", "Jagatsinghpur", "Mayurbhanj", "Konark", "Chandipur", "Gopalpur", "Chilika"]
  },
  "Punjab": {
    region: "North",
    popularCities: ["Ludhiana", "Amritsar", "Jalandhar", "Patiala"],
    allCities: ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Mohali", "Firozpur", "Batala", "Pathankot", "Moga", "Abohar", "Malerkotla", "Khanna", "Phagwara", "Muktsar", "Barnala", "Rajpura", "Hoshiarpur", "Kapurthala", "Faridkot", "Sunam", "Sangrur", "Nabha", "Zirakpur", "Kharar", "Chandigarh", "Anandpur Sahib", "Fatehgarh Sahib", "Rupnagar", "Gurdaspur", "Tarn Taran", "Mansa", "Fazilka"]
  },
  "Rajasthan": {
    region: "North",
    popularCities: ["Jaipur", "Jodhpur", "Udaipur", "Kota"],
    allCities: ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Bikaner", "Ajmer", "Bhilwara", "Alwar", "Bharatpur", "Pali", "Barmer", "Sikar", "Tonk", "Kishangarh", "Beawar", "Hanumangarh", "Sri Ganganagar", "Jhunjhunu", "Jaisalmer", "Banswara", "Nagaur", "Jhalawar", "Churu", "Dholpur", "Dausa", "Bundi", "Mount Abu", "Pushkar", "Ranthambore", "Chittorgarh", "Sawai Madhopur", "Dungarpur", "Pratapgarh", "Rajsamand", "Sirohi", "Karauli"]
  },
  "Sikkim": {
    region: "Northeast",
    popularCities: ["Gangtok", "Namchi", "Gyalshing", "Mangan"],
    allCities: ["Gangtok", "Namchi", "Gyalshing", "Mangan", "Pelling", "Yuksom", "Ravangla", "Jorethang", "Singtam", "Rangpo", "Soreng", "Chungthang", "Lachung", "Lachen", "Tsomgo Lake", "Nathula Pass", "Gurudongmar Lake", "Zero Point"]
  },
  "Tamil Nadu": {
    region: "South",
    popularCities: ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli"],
    allCities: ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli", "Tiruppur", "Vellore", "Erode", "Thoothukkudi", "Dindigul", "Thanjavur", "Ranipet", "Sivakasi", "Karur", "Udhagamandalam", "Hosur", "Nagercoil", "Kanchipuram", "Kumarakonam", "Pudukkottai", "Vriddachalam", "Pollachi", "Ramanathapuram", "Ambur", "Palani", "Kodaikanal", "Ooty", "Yercaud", "Kanyakumari", "Rameswaram", "Mahabalipuram", "Pondicherry", "Chidambaram", "Tanjore", "Kumbakonam", "Nagapattinam", "Velankanni"]
  },
  "Telangana": {
    region: "South",
    popularCities: ["Hyderabad", "Warangal", "Nizamabad", "Khammam"],
    allCities: ["Hyderabad", "Warangal", "Nizamabad", "Khammam", "Karimnagar", "Ramagundam", "Mahabubnagar", "Nalgonda", "Adilabad", "Suryapet", "Miryalaguda", "Jagtial", "Mancherial", "Nirmal", "Kothagudem", "Palwancha", "Bodhan", "Sangareddy", "Metpally", "Zahirabad", "Medak", "Kamareddy", "Vikarabad", "Wanaparthy", "Nagarkurnool", "Gadwal", "Alampur", "Bhadrachalam", "Ramappa Temple", "Thousand Pillar Temple"]
  },
  "Tripura": {
    region: "Northeast",
    popularCities: ["Agartala", "Dharmanagar", "Udaipur", "Kailashahar"],
    allCities: ["Agartala", "Dharmanagar", "Udaipur", "Kailashahar", "Ambassa", "Belonia", "Khowai", "Teliamura", "Santirbazar", "Kumarghat", "Sonamura", "Sabroom", "Kamalpur", "Bishalgarh", "Melaghar", "Ranirbazar", "Mohanpur", "Jirania", "Mandwi", "Boxanagar"]
  },
  "Uttar Pradesh": {
    region: "North",
    popularCities: ["Lucknow", "Kanpur", "Ghaziabad", "Agra"],
    allCities: ["Lucknow", "Kanpur", "Ghaziabad", "Agra", "Varanasi", "Meerut", "Allahabad", "Bareilly", "Aligarh", "Moradabad", "Saharanpur", "Gorakhpur", "Noida", "Firozabad", "Jhansi", "Muzaffarnagar", "Mathura", "Rampur", "Shahjahanpur", "Farrukhabad", "Mau", "Hapur", "Etawah", "Mirzapur", "Bulandshahr", "Sambhal", "Amroha", "Hardoi", "Fatehpur", "Raebareli", "Orai", "Sitapur", "Bahraich", "Modinagar", "Unnao", "Jaunpur", "Lakhimpur", "Hathras", "Banda", "Pilibhit", "Barabanki", "Khurja", "Gonda", "Mainpuri", "Lalitpur", "Etah", "Deoria", "Ujhani", "Ghazipur", "Sultanpur", "Azamgarh", "Bijnor", "Sahaswan", "Basti", "Chandausi", "Akbarpur", "Ballia", "Tanda", "Greater Noida", "Vrindavan", "Ayodhya", "Sarnath", "Fatehpur Sikri", "Chitrakoot", "Devgarh", "Nainital"]
  },
  "Uttarakhand": {
    region: "North",
    popularCities: ["Dehradun", "Haridwar", "Rishikesh", "Nainital"],
    allCities: ["Dehradun", "Haridwar", "Rishikesh", "Nainital", "Roorkee", "Haldwani", "Rudrapur", "Kashipur", "Rishikesh", "Mussoorie", "Almora", "Pithoragarh", "Pauri", "Tehri", "Chamoli", "Uttarkashi", "Bageshwar", "Champawat", "Rudraprayag", "Kedarnath", "Badrinath", "Gangotri", "Yamunotri", "Jim Corbett", "Valley of Flowers", "Hemkund Sahib", "Auli", "Chopta", "Kausani", "Ranikhet", "Lansdowne", "Binsar", "Mukteshwar", "Chakrata", "Dhanaulti"]
  },
  "West Bengal": {
    region: "East",
    popularCities: ["Kolkata", "Howrah", "Durgapur", "Asansol"],
    allCities: ["Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri", "Bardhaman", "Malda", "Baharampur", "Habra", "Kharagpur", "Shantipur", "Dankuni", "Dhulian", "Ranaghat", "Haldia", "Raiganj", "Krishnanagar", "Nabadwip", "Medinipur", "Jalpaiguri", "Balurghat", "Basirhat", "Bankura", "Chakdaha", "Darjeeling", "Alipurduar", "Purulia", "Jangipur", "Bolpur", "Bangaon", "Cooch Behar", "Bishnupur", "Tamluk", "Diamond Harbour", "Serampur", "Panihati", "Kamarhati", "Baranagar", "Sundarbans", "Kalimpong", "Kurseong", "Mirik", "Digha", "Mandarmani", "Bakkhali", "Shantiniketan", "Mayapur", "Dakshineswar", "Belur Math"]
  },
  "Delhi": {
    region: "North",
    popularCities: ["New Delhi", "Delhi", "Dwarka", "Rohini"],
    allCities: ["New Delhi", "Delhi", "Dwarka", "Rohini", "Janakpuri", "Lajpat Nagar", "Karol Bagh", "Connaught Place", "Vasant Kunj", "Saket", "Greater Kailash", "Defence Colony", "Lodi Road", "Chanakyapuri", "Hauz Khas", "Green Park", "Nehru Place", "Kalkaji", "Okhla", "Mayur Vihar", "Preet Vihar", "Shahdara", "Seelampur", "Gandhi Nagar", "Kirti Nagar", "Rajouri Garden", "Paschim Vihar", "Pitampura", "Model Town", "Civil Lines", "Daryaganj", "Chandni Chowk", "Red Fort", "India Gate", "Lotus Temple", "Qutub Minar", "Humayun's Tomb", "Raj Ghat"]
  },
  "Chandigarh": {
    region: "North",
    popularCities: ["Chandigarh"],
    allCities: ["Chandigarh", "Sector 17", "Sector 22", "Sector 35", "Panchkula", "Mohali"]
  },
  "Puducherry": {
    region: "South",
    popularCities: ["Puducherry", "Karaikal", "Mahe", "Yanam"],
    allCities: ["Puducherry", "Karaikal", "Mahe", "Yanam", "Auroville", "Cuddalore", "Villupuram"]
  },
  "Jammu and Kashmir": {
    region: "North",
    popularCities: ["Srinagar", "Jammu", "Gulmarg", "Pahalgam"],
    allCities: ["Srinagar", "Jammu", "Gulmarg", "Pahalgam", "Sonamarg", "Anantnag", "Baramulla", "Kupwara", "Pulwama", "Shopian", "Kulgam", "Bandipora", "Ganderbal", "Budgam", "Kathua", "Samba", "Udhampur", "Reasi", "Rajouri", "Poonch", "Doda", "Kishtwar", "Ramban", "Kashmir Valley", "Amarnath", "Vaishno Devi", "Dal Lake", "Nigeen Lake", "Betaab Valley", "Chandanwari", "Thajiwas Glacier"]
  },
  "Andaman and Nicobar Islands": {
    region: "Islands",
    popularCities: ["Port Blair", "Havelock", "Neil Island", "Diglipur"],
    allCities: ["Port Blair", "Havelock", "Neil Island", "Diglipur", "Mayabunder", "Rangat", "Baratang", "Long Island", "Ross Island", "North Bay", "Viper Island", "Jolly Buoy", "Red Skin Island", "Cinque Island", "Little Andaman", "Car Nicobar", "Katchal", "Nancowry", "Great Nicobar", "Campbell Bay", "Radhanagar Beach", "Elephant Beach", "Kalapathar Beach", "Laxmanpur Beach", "Bharatpur Beach", "Corbyn's Cove", "Wandoor Beach", "Limestone Caves", "Mud Volcano", "Cellular Jail"]
  },
  "Lakshadweep": {
    region: "Islands",
    popularCities: ["Kavaratti", "Agatti", "Minicoy", "Bangaram"],
    allCities: ["Kavaratti", "Agatti", "Minicoy", "Bangaram", "Kalpeni", "Kadmat", "Kiltan", "Chetlat", "Bitra", "Andrott", "Amini", "Thinnakara", "Parali I", "Parali II", "Suheli Par", "Pitti"]
  },
  "Dadra and Nagar Haveli and Daman and Diu": {
    region: "West",
    popularCities: ["Daman", "Diu", "Silvassa", "Dadra"],
    allCities: ["Daman", "Diu", "Silvassa", "Dadra", "Nagar Haveli", "Vapi", "Naroli", "Khanvel", "Dudhani", "Samarvarni", "Kilvani", "Rakholi", "Mandoni", "Dahikhed", "Masat", "Velugam", "Nagwa", "Ghogla Beach", "Devka Beach", "Jampore Beach"]
  }
};

export const getStatesByRegion = () => {
  const regions: Record<string, string[]> = {
    North: [],
    South: [],
    East: [],
    West: [],
    Central: [],
    Northeast: [],
    Islands: []
  };

  Object.entries(indianStates).forEach(([state, data]) => {
    regions[data.region].push(state);
  });

  return regions;
};

export const getAllStates = () => Object.keys(indianStates).sort();

export const getCitiesByState = (state: string) => {
  const stateData = indianStates[state];
  if (!stateData) return [];
  
  // Return popular cities first, then remaining cities
  const popularCities = stateData.popularCities;
  const remainingCities = stateData.allCities.filter(city => !popularCities.includes(city));
  
  return [...popularCities, ...remainingCities];
};

export const getPopularCitiesByState = (state: string) => {
  return indianStates[state]?.popularCities || [];
};

export const searchCities = (query: string, state?: string) => {
  const searchTerm = query.toLowerCase();
  
  if (state) {
    const cities = getCitiesByState(state);
    return cities.filter(city => city.toLowerCase().includes(searchTerm));
  }
  
  // Search across all cities
  const allCities: string[] = [];
  Object.values(indianStates).forEach(stateData => {
    allCities.push(...stateData.allCities);
  });
  
  return allCities.filter(city => city.toLowerCase().includes(searchTerm));
};