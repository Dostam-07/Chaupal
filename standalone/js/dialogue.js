/* Village Chaupal — dialogue content.
   Four village women share their daily struggles around girls' education,
   in warm Hinglish (matching the reference mockup's tone). Content is
   illustrative of rural India and kept factual-but-soft (no hard numbers
   that could be wrong). */

window.V_DIALOGUE = {
  intro: {
    speaker: "Radha Devi",
    avatar: "radha",
    text: "Namaste! 😊 Beti, padhai ko lekar yahan gaon mein kaafi challenges hain... Kya aap bhi kuch kehna chahti hain?"
  },

  women: [
    {
      id: "radha", name: "Radha Devi", age: 52, role: "Gaon ki badi amma",
      sari: "#c23b6b", blouse: "#992255", skin: "#c68a56", dupatta: "#f1a7b8",
      posName: "Center (on rug)",
      hook: "Ghar ke kaam, ladkiyon ki padhai ka pehla rukawat",
      chat: [
        { sp: "Radha Devi", t: "Namaste! 😊 Beti, padhai ko lekar yahan gaon mein kaafi challenges hain... Kya aap bhi kuch kehna chahti hain?" },
        { sp: "Radha Devi", t: "Subah subah handpump se paani, ghar ke kaam, chhote bachhon ki dekhbhal... ladkiyon ke paas padhai ka time nahi bachta. 😔" },
        { sp: "Radha Devi", t: "Meri poti late night tak homework karti hai, diye ki roshni mein. Aankhein thak jaati hain, par himmat nahi haarti." },
        { sp: "Radha Devi", t: "Purane zamane mein hum kehte the — ladki ko padha kar kya karenge. Par main ab samajhti hoon, padhi hui ladki poore parivaar ko sambhal sakti hai." },
        { sp: "Radha Devi", t: "Bas chahti hoon ki gaon ke sab log ladkiyon ko school bhejein, kaam se pehle padhai ka waqt mile. ❤️" }
      ]
    },
    {
      id: "meena", name: "Meena", age: 24, role: "Shaam ki pathshala didi",
      sari: "#e59b20", blouse: "#b87514", skin: "#b5724a", dupatta: "#d4402a",
      posName: "Left (on stone platform)",
      hook: "17 saal mein shaadi ke baad padhai chhoot gayi, ab shyaam ko padhati hoon",
      chat: [
        { sp: "Meena", t: "Main 10th mein thi jab meri shaadi ho gayi. Uske baad school jana bandh. Dil mein dard rehta hai aaj bhi. 🥺" },
        { sp: "Meena", t: "Ab shaam ko main gaon ki 8–10 chhoti ladkiyon ko 'क' 'ख' aur counting sikhati hoon, apne aangan mein." },
        { sp: "Meena", t: "Na chahti hoon ki koi ladki meri tarah beech mein chhode. Shaadi ka pressure padhai se pehle nahi hona chahiye." },
        { sp: "Meena", t: "Meri ek chhoti si khwaish hai — ek pankha, ek blackboard, aur ye ladkiyaan roz aayein. Padhaai ka diya na bujhe! 🙏" }
      ]
    },
    {
      id: "kavita", name: "Kavita", age: 17, role: "11th class student • Padhne ki ummeed",
      sari: "#2b5282", blouse: "#ffffff", skin: "#c08a5e", dupatta: "#3b6bb0",
      posName: "Front (facing group)",
      hook: "Phone se online class, par data pack aur bijli dono nahi",
      chat: [
        { sp: "Kavita", t: "Main abhi 11th mein hoon! Papa ke phone se online class karti hoon — par data pack mahina mahina pura ho jaata hai. 📱" },
        { sp: "Kavita", t: "Bijli bhi kati rehti hai. Kabhi kabhi poori class chhoot jaati hai, phir notes friend se copy karti hoon." },
        { sp: "Kavita", t: "Gaon mein koi library nahi hai. Library hoti toh main roz kuch naya seekhti. Main teacher banna chahti hoon! ✨" },
        { sp: "Kavita", t: "Data pack aur ek chhota sa library ho toh dekhiye — ye gaon ki ladkiyaan kya kya kar dikhaayengi! 🌟" }
      ]
    },
    {
      id: "savitri", name: "Savitri", age: 28, role: "6th class ki maa",
      sari: "#2d733e", blouse: "#1c522a", skin: "#b97e4f", dupatta: "#d4a017",
      posName: "Right (on rug)",
      hook: "School 6 km door, aur periods ke din to school hi nahi ja paati",
      chat: [
        { sp: "Savitri", t: "Meri beti 6th mein padhti hai. School 6 kilometre door hai — koi bus nahi, ladkiyan sunsan raste se paidal jaati hain. 🙁" },
        { sp: "Savitri", t: "Raste mein khet aur sunsan rasta — subah andhera hi hota hai. Main ummeed ke saath bhejti hoon, par dar bhi lagta hai." },
        { sp: "Savitri", t: "Aur ek baat: school mein ladkiyon ka toilet nahi hai, na pads milte hain. Chaar-paanch din har mahine beti school nahi ja pati." },
        { sp: "Savitri", t: "Agar school ke pass cycle ya rickshaw ka intizaam ho... toh kitni ladkiyan hi roz padh jaayein! 🤲" }
      ]
    }
  ],

  facts: [
    {
      title: "Right to Education Act, 2009",
      text: "Is kanoon ke mutabik har bacha (6–14 saal) ko free aur compulsory padhai ka haq hai. School se koi bhi bacha bahar nahi nikala ja sakta.",
      tag: "Kanoon"
    },
    {
      title: "Dropout class 5–8 tak",
      text: "Kaafi gaon mein ladkiyon ki padhai class 5–8 ke beech ruk jaati hai — ghar ke kaam, school ki doori aur shaadi ke pressure ki wajah se.",
      tag: "Asli haqeeqat"
    },
    {
      title: "Periods = school ke chhuti ke din",
      text: "Har mahine 4–5 din. School mein ladkiyon ke liye toilet na ho aur pads na milein, toh woh din school nahi ja pati. Dheere dheere school chhoot jaata hai.",
      tag: "Health"
    },
    {
      title: "School 5–8 km door",
      text: "Transport nahi hota toh ladkiyaan paidal jaati hain — sunsaan raste, andhera subah, aur parivaar ki chinta. Cycle ya bus route se bada farak padta hai.",
      tag: "Duri"
    },
    {
      title: "Digital divide",
      text: "Online class ke liye phone, data pack aur bijli — teeno zaroori cheezein kaafi gharon mein nahi hoti. Ladkiyan notes ke liye doosron par nirbhar rehti hain.",
      tag: "Technology"
    }
  ],

  solutions: [
    {
      title: "Cycle + Safe Route",
      text: "Cycle distribution aur school bus/path route — doori aur sunsaan raste ka darr khatam. Jaha cycle pahunchi, waha ladkiyan school pahunchi.",
      tag: "Transport"
    },
    {
      title: "Girls' Toilet + Pad Machine",
      text: "School mein ladkiyon ka saaf toilet aur sanitary pad vending machine. Periods ke din ab school na chhootein. Awareness aur pad distribution bhi.",
      tag: "Health"
    },
    {
      title: "Shaam ki Pathshala",
      text: "Gaon ke aangan mein evening classes — pankha, blackboard aur kitabein. Jo ladki school na ja sake, woh shaam ko padh ke aa sakti hai.",
      tag: "Community"
    },
    {
      title: "Scholarship + Study Kits",
      text: "Ladkiyon ke liye scholarship, uniform, books aur stationery — ghar ka kharcha na rukawat baney. Padhi likhi beti scholarship se aage badhti hai.",
      tag: "Support"
    },
    {
      title: "Community Library + Solar",
      text: "Ek chhoti si library — bookein, solar charger aur ek internet connection. Kavita jaise sapne dekhne walon ke liye ye peat ka kaam karegi.",
      tag: "Digital"
    }
  ],

  impact: [
    {
      when: "6 mahine baad",
      title: "Kavita ne 10th first division se pass ki",
      text: "Solar charger aur data support ke baad online classes miss nahi hui. Aaj wo saari gaon ki ladkiyon ko pathshala mein padhati hai."
    },
    {
      when: "1 saal baad",
      title: "School mein girls' toilet aur pad machine",
      text: "Savitri ji ki beti ab periods ke din bhi school jaati hai. Mahine ki 4–5 din ki chhutti khatam — attendance badhi."
    },
    {
      when: "1.5 saal baad",
      title: "SHG ne 6 ladkiyon ko cycle dilayi",
      text: "Mahila self-help group ne cycle bank banaya. School 6 km door ho ya 8 — ladkiyaan ab cycle se pahunchti hain."
    },
    {
      when: "2 saal baad",
      title: "Radha ji ki poti regular school jaati hai",
      text: "Ghar ke kaam ka bhaag kam karne ke liye parivaar razi hua. Sabse pehle padhai, phir kaam — ye radha ji ka naya usool hai."
    },
    {
      when: "Aaj",
      title: "Evening pathshala — 14 ladkiyaan roz aati hain",
      text: "Meena didi ki pathshala ab aangan se badhkar school ke pass khuli hai. Ek pankha, ek blackboard — aur hazaaron sapne."
    }
  ]
};