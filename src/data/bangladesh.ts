export interface DistrictOption {
  name: string;
  areas: string[];
}

export interface DivisionData {
  division: string;
  districts: Record<string, string[]>;
}

export const bangladeshDivisions: DivisionData[] = [
  {
    division: "Dhaka",
    districts: {
      "Dhaka": [
        "Gulshan",
        "Banani",
        "Dhanmondi",
        "Uttara",
        "Mirpur",
        "Mohammadpur",
        "Motijheel",
        "Tejgaon",
        "Badda",
        "Bashundhara R/A",
        "Khilgaon",
        "Paltan",
        "Ramna",
        "Jatrabari",
        "Lalbagh",
        "New Market",
        "Shahbagh",
        "Rampura",
        "Hazaribagh",
        "Demra",
        "Sutrapur",
        "Kotwali",
        "Cantonment",
        "Kafrul",
        "Kamrangirchar",
        "Turag",
        "Airport",
        "Vatara",
        "Khilkhet",
        "Mohakhali",
        "Old Dhaka",
        "Savar",
        "Dhamrai",
        "Keraniganj",
        "Nawabganj",
        "Dohar"
      ],
      "Gazipur": [
        "Gazipur Sadar",
        "Tongi",
        "Kaliakair",
        "Kaliganj",
        "Kapasia",
        "Sreepur"
      ],
      "Narayanganj": [
        "Narayanganj Sadar",
        "Bandar",
        "Araihazar",
        "Rupganj",
        "Sonargaon",
        "Siddhirganj",
        "Fatullah"
      ],
      "Tangail": [
        "Tangail Sadar",
        "Basail",
        "Bhuapur",
        "Delduar",
        "Dhanbari",
        "Ghatail",
        "Gopalpur",
        "Kalihati",
        "Madhupur",
        "Mirzapur",
        "Nagarpur",
        "Sakhipur"
      ],
      "Narsingdi": [
        "Narsingdi Sadar",
        "Belabo",
        "Monohardi",
        "Palash",
        "Raipura",
        "Shibpur"
      ],
      "Kishoreganj": [
        "Kishoreganj Sadar",
        "Austagram",
        "Bajitpur",
        "Bhairab",
        "Hossainpur",
        "Itna",
        "Karimganj",
        "Katiadi",
        "Kuliarchar",
        "Mithamain",
        "Nikli",
        "Pakundia",
        "Tarail"
      ],
      "Manikganj": [
        "Manikganj Sadar",
        "Daulatpur",
        "Ghior",
        "Harirampur",
        "Saturia",
        "Shibalaya",
        "Singair"
      ],
      "Munshiganj": [
        "Munshiganj Sadar",
        "Gazaria",
        "Louhajang",
        "Serajdikhan",
        "Sreenagar",
        "Tongibari"
      ],
      "Faridpur": [
        "Faridpur Sadar",
        "Alfadanga",
        "Bhanga",
        "Boalmari",
        "Charbhadrasan",
        "Madhukhali",
        "Nagarkanda",
        "Sadarpur",
        "Saltha"
      ],
      "Gopalganj": [
        "Gopalganj Sadar",
        "Kashiani",
        "Kotalipara",
        "Muksudpur",
        "Tungipara"
      ],
      "Madaripur": [
        "Madaripur Sadar",
        "Kalkini",
        "Rajoir",
        "Shibchar",
        "Dasar"
      ],
      "Rajbari": [
        "Rajbari Sadar",
        "Baliakandi",
        "Goalandaghat",
        "Kalukhali",
        "Pangsha"
      ],
      "Shariatpur": [
        "Shariatpur Sadar",
        "Bhedarganj",
        "Damudya",
        "Gosairhat",
        "Naria",
        "Zanjira"
      ]
    }
  },
  {
    division: "Chattogram",
    districts: {
      "Chattogram": [
        "Agrabad",
        "GEC Circle",
        "Nasirabad",
        "Panchlaish",
        "Halishahar",
        "Khulshi",
        "Chawkbazar",
        "Patenga",
        "Kotwali",
        "Chandgaon",
        "Double Mooring",
        "Pahartali",
        "Bakalia",
        "Bayezid",
        "EPZ",
        "Anwara",
        "Banshkhali",
        "Boalkhali",
        "Chandanaish",
        "Fatikchhari",
        "Hathazari",
        "Karnaphuli",
        "Lohagara",
        "Mirsharai",
        "Patiya",
        "Rangunia",
        "Raozan",
        "Sandwip",
        "Satkania",
        "Sitakunda"
      ],
      "Cox's Bazar": [
        "Cox's Bazar Sadar",
        "Chakaria",
        "Eidgaon",
        "Kutubdia",
        "Maheshkhali",
        "Pekua",
        "Ramu",
        "Teknaf",
        "Ukhia"
      ],
      "Cumilla": [
        "Cumilla Adarsha Sadar",
        "Cumilla Sadar Dakshin",
        "Barura",
        "Brahmanpara",
        "Burichang",
        "Chandina",
        "Chauddagram",
        "Daudkandi",
        "Debidwar",
        "Homna",
        "Laksam",
        "Lalmai",
        "Meghna",
        "Monohargonj",
        "Muradnagar",
        "Nangalkot",
        "Titas"
      ],
      "Feni": [
        "Feni Sadar",
        "Chhagalnaiya",
        "Daganbhuiyan",
        "Fulgazi",
        "Parshuram",
        "Sonagazi"
      ],
      "Brahmanbaria": [
        "Brahmanbaria Sadar",
        "Akhaura",
        "Ashuganj",
        "Bancharampur",
        "Bijoynagar",
        "Kasba",
        "Nabinagar",
        "Nasirnagar",
        "Sarail"
      ],
      "Chandpur": [
        "Chandpur Sadar",
        "Faridganj",
        "Haimchar",
        "Haziganj",
        "Kachua",
        "Matlab Dakshin",
        "Matlab Uttar",
        "Shahrasti"
      ],
      "Lakshmipur": [
        "Lakshmipur Sadar",
        "Kamalnagar",
        "Raipur",
        "Ramganj",
        "Ramgati"
      ],
      "Noakhali": [
        "Noakhali Sadar",
        "Begumganj",
        "Chatkhil",
        "Companiganj",
        "Hatiya",
        "Kabirhat",
        "Senbagh",
        "Sonaimuri",
        "Subarnachar"
      ],
      "Khagrachhari": [
        "Khagrachhari Sadar",
        "Dighinala",
        "Guimara",
        "Lakshmichhari",
        "Mahalchhari",
        "Manikchhari",
        "Matiranga",
        "Panchhari",
        "Ramgarh"
      ],
      "Rangamati": [
        "Rangamati Sadar",
        "Baghaichhari",
        "Barkal",
        "Belaichhari",
        "Jurachhari",
        "Kaptai",
        "Kawkhali",
        "Langadu",
        "Naniarchar",
        "Rajasthali"
      ],
      "Bandarban": [
        "Bandarban Sadar",
        "Alikadam",
        "Lama",
        "Naikhongchhari",
        "Rowangchhari",
        "Ruma",
        "Thanchi"
      ]
    }
  },
  {
    division: "Rajshahi",
    districts: {
      "Rajshahi": [
        "Boalia",
        "Motihar",
        "Rajpara",
        "Shah Mokhdum",
        "Chandrima",
        "Kashiadanga",
        "Katakhali",
        "Belpukur",
        "Bagha",
        "Bagmara",
        "Charghat",
        "Durgapur",
        "Godagari",
        "Mohanpur",
        "Paba",
        "Puthia",
        "Tanore"
      ],
      "Bogura": [
        "Bogura Sadar",
        "Adamdighi",
        "Dhunat",
        "Dhupchanchia",
        "Gabtali",
        "Kahaloo",
        "Nandigram",
        "Sahajanpur",
        "Sariakandi",
        "Sherpur",
        "Shibganj",
        "Sonatala"
      ],
      "Pabna": [
        "Pabna Sadar",
        "Atgharia",
        "Bera",
        "Bhangura",
        "Chatmohar",
        "Faridpur",
        "Ishwardi",
        "Santhia",
        "Sujanagar"
      ],
      "Natore": [
        "Natore Sadar",
        "Bagatipara",
        "Baraigram",
        "Gurudaspur",
        "Lalpur",
        "Naldanga",
        "Singra"
      ],
      "Naogaon": [
        "Naogaon Sadar",
        "Atrai",
        "Badalgachhi",
        "Dhamoirhat",
        "Manda",
        "Mohadevpur",
        "Niamatpur",
        "Patnitala",
        "Porsha",
        "Raninagar",
        "Sapahar"
      ],
      "Chapainawabganj": [
        "Chapainawabganj Sadar",
        "Bholahat",
        "Gomastapur",
        "Nachole",
        "Shibganj"
      ],
      "Joypurhat": [
        "Joypurhat Sadar",
        "Akkelpur",
        "Kalai",
        "Khetlal",
        "Panchbibi"
      ],
      "Sirajganj": [
        "Sirajganj Sadar",
        "Belkuchi",
        "Chauhali",
        "Kamarkhanda",
        "Kazipur",
        "Raiganj",
        "Shahjadpur",
        "Tarash",
        "Ullahpara"
      ]
    }
  },
  {
    division: "Khulna",
    districts: {
      "Khulna": [
        "Khulna Sadar",
        "Sonadanga",
        "Khalishpur",
        "Daulatpur",
        "Khan Jahan Ali",
        "Harintana",
        "Aranghata",
        "Batiaghata",
        "Dacope",
        "Dighalia",
        "Dumuria",
        "Koyra",
        "Paikgachha",
        "Phultala",
        "Rupsha",
        "Terokhada"
      ],
      "Jashore": [
        "Jashore Sadar",
        "Abhaynagar",
        "Bagherpara",
        "Chaugachha",
        "Jhikargachha",
        "Keshabpur",
        "Manirampur",
        "Sharsha",
        "Benapole"
      ],
      "Kushtia": [
        "Kushtia Sadar",
        "Bheramara",
        "Daulatpur",
        "Khoksa",
        "Kumarkhali",
        "Mirpur"
      ],
      "Bagerhat": [
        "Bagerhat Sadar",
        "Chitalmari",
        "Fakirhat",
        "Kachua",
        "Mollahat",
        "Mongla",
        "Morrelganj",
        "Rampal",
        "Sarankhola"
      ],
      "Chuadanga": [
        "Chuadanga Sadar",
        "Alamdanga",
        "Damurhuda",
        "Jibannagar"
      ],
      "Jhenaidah": [
        "Jhenaidah Sadar",
        "Harinakundu",
        "Kaliganj",
        "Kotchandpur",
        "Maheshpur",
        "Shailkupa"
      ],
      "Magura": [
        "Magura Sadar",
        "Mohammadpur",
        "Shalikha",
        "Sreepur"
      ],
      "Meherpur": [
        "Meherpur Sadar",
        "Gangni",
        "Mujibnagar"
      ],
      "Narail": [
        "Narail Sadar",
        "Kalia",
        "Lohagara"
      ],
      "Satkhira": [
        "Satkhira Sadar",
        "Assasuni",
        "Debhata",
        "Kalaroa",
        "Kaliganj",
        "Shyamnagar",
        "Tala"
      ]
    }
  },
  {
    division: "Barishal",
    districts: {
      "Barishal": [
        "Barishal Sadar",
        "Agailjhara",
        "Babuganj",
        "Bakerganj",
        "Banaripara",
        "Gaurnadi",
        "Hizla",
        "Mehendiganj",
        "Muladi",
        "Wazirpur",
        "Kotwali"
      ],
      "Patuakhali": [
        "Patuakhali Sadar",
        "Bauphal",
        "Dashmina",
        "Dumki",
        "Galachipa",
        "Kalapara",
        "Mirzaganj",
        "Rangabali",
        "Kuakata"
      ],
      "Barguna": [
        "Barguna Sadar",
        "Amtali",
        "Bamna",
        "Betagi",
        "Patharghata",
        "Taltali"
      ],
      "Bhola": [
        "Bhola Sadar",
        "Burhanuddin",
        "Char Fasson",
        "Daulatkhan",
        "Lalmohan",
        "Manpura",
        "Tazumuddin"
      ],
      "Jhalokathi": [
        "Jhalokathi Sadar",
        "Kanthalia",
        "Nalchity",
        "Rajapur"
      ],
      "Pirojpur": [
        "Pirojpur Sadar",
        "Bhandaria",
        "Indurkani (Zianagar)",
        "Kawkhali",
        "Mathbaria",
        "Nazirpur",
        "Nesarabad (Swarupkati)"
      ]
    }
  },
  {
    division: "Sylhet",
    districts: {
      "Sylhet": [
        "Sylhet Sadar",
        "Amberkhana",
        "Zindabazar",
        "Upashahar",
        "Shibganj",
        "Kotwali",
        "Balaganj",
        "Beanibazar",
        "Bishwanath",
        "Companiganj",
        "Dakshin Surma",
        "Fenchuganj",
        "Golapganj",
        "Gowainghat",
        "Jaintiapur",
        "Kanaighat",
        "Osmani Nagar",
        "Zakiganj"
      ],
      "Moulvibazar": [
        "Moulvibazar Sadar",
        "Barlekha",
        "Juri",
        "Kamalganj",
        "Kulaura",
        "Rajnagar",
        "Sreemangal"
      ],
      "Habiganj": [
        "Habiganj Sadar",
        "Ajmiriganj",
        "Bahubal",
        "Baniyachong",
        "Chunarughat",
        "Lakhai",
        "Madhabpur",
        "Nabiganj",
        "Sayestaganj"
      ],
      "Sunamganj": [
        "Sunamganj Sadar",
        "Bishwamvarpur",
        "Chhatak",
        "Derai",
        "Dharamapasha",
        "Dowarabazar",
        "Jagannathpur",
        "Jamalganj",
        "Madhyanagar",
        "Shantiganj",
        "Sullah",
        "Tahirpur"
      ]
    }
  },
  {
    division: "Rangpur",
    districts: {
      "Rangpur": [
        "Rangpur Sadar",
        "Badarganj",
        "Gangachhara",
        "Kaunia",
        "Mithapukur",
        "Pirgachha",
        "Pirganj",
        "Taraganj",
        "Kotwali"
      ],
      "Dinajpur": [
        "Dinajpur Sadar",
        "Birampur",
        "Birganj",
        "Birol",
        "Bochaganj",
        "Chirirbandar",
        "Ghoraghat",
        "Hakimpur",
        "Kaharole",
        "Khansama",
        "Nawabganj",
        "Parbatipur",
        "Phulbari"
      ],
      "Gaibandha": [
        "Gaibandha Sadar",
        "Fulchhari",
        "Gobindaganj",
        "Palashbari",
        "Sadullapur",
        "Sughatta",
        "Sundarganj"
      ],
      "Kurigram": [
        "Kurigram Sadar",
        "Bhurungamari",
        "Char Rajibpur",
        "Chilmari",
        "Nageshwari",
        "Phulbari",
        "Rajarhat",
        "Raomari",
        "Ulipur"
      ],
      "Lalmonirhat": [
        "Lalmonirhat Sadar",
        "Aditmari",
        "Hatibandha",
        "Kaliganj",
        "Patgram"
      ],
      "Nilphamari": [
        "Nilphamari Sadar",
        "Dimla",
        "Domar",
        "Jaldhaka",
        "Kishoreganj",
        "Saidpur"
      ],
      "Panchagarh": [
        "Panchagarh Sadar",
        "Atwari",
        "Boda",
        "Debiganj",
        "Tetulia"
      ],
      "Thakurgaon": [
        "Thakurgaon Sadar",
        "Baliadangi",
        "Haripur",
        "Pirganj",
        "Ranisankhail"
      ]
    }
  },
  {
    division: "Mymensingh",
    districts: {
      "Mymensingh": [
        "Mymensingh Sadar",
        "Bhaluka",
        "Dhobaura",
        "Fulbaria",
        "Gaffargaon",
        "Gauripur",
        "Haluaghat",
        "Ishwarganj",
        "Muktagachha",
        "Nandail",
        "Phulpur",
        "Tara Khanda",
        "Trishal",
        "Kotwali"
      ],
      "Jamalpur": [
        "Jamalpur Sadar",
        "Bakshiganj",
        "Dewanganj",
        "Islampur",
        "Madarganj",
        "Melandaha",
        "Sarishabari"
      ],
      "Netrokona": [
        "Netrokona Sadar",
        "Atpara",
        "Barhatta",
        "Durgapur",
        "Kalmakanda",
        "Kendua",
        "Khaliajuri",
        "Madan",
        "Mohanganj",
        "Purbadhala"
      ],
      "Sherpur": [
        "Sherpur Sadar",
        "Jhenaigati",
        "Nakla",
        "Nalitabari",
        "Sreebardi"
      ]
    }
  }
];

export const activeCouriers = [
  { id: "pathao", name: "Pathao Express", estimatedDays: "24 - 48 Hours in Dhaka, 3 Days Nationwide", speed: "Fast" },
  { id: "steadfast", name: "Steadfast Courier", estimatedDays: "2 - 4 Business Days Across All 64 Districts", speed: "Reliable" },
  { id: "redx", name: "RedX Logistics", estimatedDays: "Doorstep Delivery with Live Tracking", speed: "Standard" },
];

export const mockCouriers = activeCouriers;
