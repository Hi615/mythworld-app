// Initial data seeded into the database the first time the server runs.

module.exports = {
  users: [],
  nextUserId: 1,
  nextPostId: 7,
  posts: [
    {
      id: 1,
      category: "divine",
      title: "A voice told me to pull over, seconds before the crash",
      name: "Anita R.",
      place: "Pune, India",
      image: "https://picsum.photos/seed/myth1/600/400",
      video: null,
      description: "I was driving home late at night on the highway when I heard, very clearly, a calm voice say 'pull over now'. I didn't recognize the voice — it wasn't in my head the way thoughts usually are. I pulled onto the shoulder without thinking, and about ten seconds later a truck that had drifted into my lane sped past exactly where I would have been. I sat there shaking for almost twenty minutes. I've never told anyone except my mother, who said her own mother used to talk about a 'guardian voice' that ran in our family.",
      comments: [
        { who: "Marcus T.", text: "This gave me chills. My grandmother described something almost identical." }
      ],
      userId: null,
      createdAt: "2024-01-01T00:00:00.000Z"
    },
    {
      id: 2,
      category: "supernatural",
      title: "The rocking chair in my grandmother's house still moves",
      name: "Daniel K.",
      place: "Savannah, Georgia, USA",
      image: "https://picsum.photos/seed/myth2/600/400",
      video: null,
      description: "My grandmother passed away three years ago and we kept her house. Her rocking chair sits in the corner of the living room, and at least once a week, usually around dusk, it starts rocking gently on its own — no draft, no pets, nothing. The first time it happened my sister and I both saw it and just stood there. We've stopped being scared of it. It feels more like... she's still checking in on the place.",
      comments: [],
      userId: null,
      createdAt: "2024-01-02T00:00:00.000Z"
    },
    {
      id: 3,
      category: "cryptid",
      title: "Something kept pace with our car through the forest road",
      name: "Liam O.",
      place: "Black Forest, Germany",
      image: "https://picsum.photos/seed/myth3/600/400",
      video: null,
      description: "We were driving back from a hiking trip around 11pm on a narrow forest road with dense trees on both sides. For almost two minutes, something large was moving parallel to the car, just inside the treeline, matching our speed almost exactly. It was too dark to see clearly, but it moved upright, like on two legs, weaving between trunks without slowing down. When the road curved away from the trees it was gone. None of us have been able to explain what an animal that size, moving that fast on two legs, would be.",
      comments: [
        { who: "Priya S.", text: "There are similar reports from that exact stretch of forest if you search local folklore forums." },
        { who: "Tomasz W.", text: "Could it have been a deer running upright briefly? Either way, that's unsettling." }
      ],
      userId: null,
      createdAt: "2024-01-03T00:00:00.000Z"
    },
    {
      id: 4,
      category: "dream",
      title: "I dreamed of the earthquake three nights before it happened",
      name: "Fatima A.",
      place: "Izmir, Turkey",
      image: "https://picsum.photos/seed/myth4/600/400",
      video: null,
      description: "Three nights before the earthquake hit our region, I had an extremely vivid dream of the ground splitting open near the old market and a specific blue door falling off its hinges. I told my husband about it the next morning because it felt so real. When the earthquake actually happened, that exact blue door — on a shop we walk past every day — was one of the first things to fall. I don't believe I can predict the future, but I haven't been able to shake this one.",
      comments: [],
      userId: null,
      createdAt: "2024-01-04T00:00:00.000Z"
    },
    {
      id: 5,
      category: "unexplained",
      title: "Every clock in the house stopped at the same minute",
      name: "Robert N.",
      place: "Edinburgh, Scotland",
      image: "https://picsum.photos/seed/myth5/600/400",
      video: null,
      description: "On the morning my father passed away in hospital, my mother noticed that the kitchen clock had stopped. Later that day, while going through the house, we realized that three other clocks — including a battery wall clock, a wind-up mantel clock, and my father's wristwatch on the dresser — had all stopped within two minutes of each other, and within minutes of the time we were later told he had died. The wristwatch hadn't been touched in days.",
      comments: [
        { who: "Helen B.", text: "I'm so sorry for your loss. This happened in my family too, with my grandfather's pocket watch." }
      ],
      userId: null,
      createdAt: "2024-01-05T00:00:00.000Z"
    },
    {
      id: 6,
      category: "myth",
      title: "The old well that villagers still won't draw water from",
      name: "Carlos M.",
      place: "Oaxaca, Mexico",
      image: "https://picsum.photos/seed/myth6/600/400",
      video: null,
      description: "There's a centuries-old well on the edge of my hometown that no one in living memory has used, even during droughts when every other source ran dry. The story passed down is that a woman drowned herself there after a tragedy, and that the water 'remembers'. As a kid I always thought it was superstition until I visited at dusk once — the air around it was noticeably colder than anywhere else nearby, even in summer. I still don't have an explanation for the temperature difference.",
      comments: [],
      userId: null,
      createdAt: "2024-01-06T00:00:00.000Z"
    }
  ]
};
