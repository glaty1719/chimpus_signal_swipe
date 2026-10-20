**GAME DESIGN DOCUMENT**

## **Chimpu's Signal Swipe**

## 

### **1\. Executive Summary**

**Game Title:** Chimpu's Signal Swipe  
**Curriculum:** Grade 6–8, Module 1, Week 1 (Unpacking AI: What It Is and Where It Hides)  
**Target Age:** 11–14 years  
**Genre:** Three-Way Swipe Sorter  
**Shared Engine:** Swipe Sorter  
**Platform:** HTML5 Canvas, Phaser 3 integrated with React  
**Orientation:** Landscape, 16:9  
**Development Resolution:** 1280 × 720  
**Session Length:** 5–6 minutes  
**Difficulty:** Easy to moderate  
**Fink Dimensions:** Foundational Knowledge, Application, Learning How to Learn  
**Failure Condition:** No permanent game-over

### **2\. Educational Objective**

Students should be able to define AI and recognize where it hides inside the apps and devices they already use.

**Students should learn to separate three things:**

* AI features: learn from data to recognize, predict, recommend or generate

* Fixed automation: follows rules or timers that people set in advance

* Manual tools: do nothing unless a person operates them

The game should teach that AI is usually a feature inside a product, not the whole device.

### **3\. Core Learning Message**

AI learns patterns from data. Automation follows fixed rules. A phone is not "AI"; its face unlock, autocorrect and photo sorting are.

### **4\. Player Fantasy**

Chimpu has been assigned as a new AI Agent at the Signal Tower, the control room that watches every device in the city.

Thousands of feature signals are arriving. The student works beside Chimpu as Signal Lead and routes each signal into the right channel so Chimpu can build a map of where AI really lives.

### **5\. Environment Theme**

The game takes place inside the Signal Tower control room.

**Background elements:**

* Large panoramic window showing a stylized city at dusk

* Three glowing signal channels

* Floating monitors with city districts

* Radar sweep on the floor

* Small maintenance drones

* Signal cables pulsing with light

The environment should use flat 2D vector graphics with subtle parallax on the city layer. Signal movement and channel glows are created with Phaser tweens and particles.

### **6\. Visual Style**

* Clean, slightly futuristic 2D vector art

* Rounded shapes with medium outlines

* Dark navy control room with bright signal colors

* Large card icons with short labels

* Tone should feel cool and capable, not babyish

* Chimpu wears his Agent visor and wrist console in this grade band

**Color system:**

* AI channel: Cyan with sparkle-chip symbol

* Fixed Automation channel: Amber with gear-and-clock symbol

* Manual Tool channel: Coral with hand symbol

* Correct feedback: Mint green with checkmark

* Retry feedback: Warm yellow with question mark

* Interface text: White on dark navy

### **7\. Screen Layout**

**Top-left:**

* Current district

* Signals mapped counter

**Top-center:**

* Streak meter

**Top-right:**

* Pause button

* Sound button

**Center:**

* Incoming signal card

**Right edge:**

* AI channel

**Left edge:**

* Fixed Automation channel

**Bottom edge:**

* Manual Tool channel

**Bottom-left corner:**

* Chimpu at his console, reacting to each routing

### **8\. Controls**

**Touch and mouse:**

* Swipe or drag right: AI

* Swipe or drag left: Fixed Automation

* Swipe or drag down: Manual Tool

* Tap one of three large channel buttons as an alternative

**Keyboard support:**

* Right Arrow or D: AI

* Left Arrow or A: Fixed Automation

* Down Arrow or S: Manual Tool

* Number keys 1, 2, 3 for Reason Chips

### **9\. Visual Tutorial**

**Tutorial sequence:**

1. Chimpu powers on the console.

2. A card appears: "Face Unlock".

3. A glowing hand swipes it right into the AI channel.

4. The label LEARNS FROM DATA appears.

5. A second card appears: "Microwave Timer".

6. The hand swipes it left.

7. The label FIXED RULE appears.

8. The hand disappears and the student takes control.

No instruction screen with paragraphs should appear.

### **10\. Core Gameplay Loop**

1. A signal card slides in from the top of the screen.

2. The card drifts slowly toward the center.

3. The student routes it into a channel.

4. Correct cards zip into the channel and light up a city district.

5. Incorrect cards bounce back with a one-line explanation.

6. In Levels 2 and 3, a Reason Chip question appears after some correct routings.

7. Filling the district map completes the level.

### **11\. Level 1: Warm-Up Signals**

Clear, obvious examples to establish the three categories.

**AI:**

* Face unlock

* Voice assistant answering a question

* Video recommendations

* Photo app that groups pictures by face

**Fixed Automation:**

* Microwave timer

* Automatic door sensor

* Washing machine cycle

* Street light that turns on at 6 p.m.

**Manual Tool:**

* Bicycle

* Pencil sharpener

* Paper map

* Hand fan

Twelve cards per round. The card waits in the center if not routed; there is no timer.

### **12\. Level 2: Hidden Signals**

AI features inside everyday apps. Cards drift slightly faster.

**AI:**

* Email spam filter

* Keyboard next-word prediction

* Map arrival time estimate

* Online shop "You may also like"

* Translation app

**Fixed Automation:**

* Calculator app

* Phone alarm clock

* Vending machine

* Traffic light on a fixed timer

**Manual Tool:**

* Flashlight switch

* Paper dictionary

Reason Chips introduced. After routing correctly, the student picks why:

* Learns from data

* Follows a fixed rule

* Needs a person to operate it

### **13\. Level 3: Same Device, Different Feature**

The same device appears in more than one card. Students must look at the feature, not the object.

**Card pairs:**

* Smart speaker: "recognizes your voice" (AI) vs "volume button" (Manual)

* Thermostat: "fixed weekly schedule" (Automation) vs "learns when you are home" (AI)

* Video game: "enemy follows a scripted path" (Automation) vs "difficulty adapts to how you play" (AI)

* Phone camera: "flash turns on in the dark" (Automation) vs "blurs the background around a person" (AI)

* Car: "cruise control keeps a set speed" (Automation) vs "lane detection camera" (AI)

When all districts are lit, the Signal Map shows every AI feature the student found.

### **14\. Correct Feedback**

* Card zips into the channel with a light trail

* Channel pulses in its color

* One- or two-word label appears (LEARNS FROM DATA, FIXED RULE, PERSON OPERATED)

* A building in the city lights up

* Rising chime plays

* Streak meter increases

* Chimpu gives a quick console nod

### **15\. Incorrect Feedback**

* Card bounces off the channel and returns to the center

* Soft "blip" sound plays

* Chimpu's console shows a one-line hint, for example: "Rule set by people: it turns off after 30 seconds."

* The card returns to the queue later in the round

* Streak resets; no points are removed

* After two mistakes on the same card, the correct channel pulses

### **16\. Progress and Rewards**

**Students collect:**

* AI Spotter Chip

* Automation Spotter Chip

* Feature Detective Chip

**Final celebration:**

* The full city Signal Map lights up

* Hidden AI features appear as cyan icons across the city

* Chimpu's visor flashes and he salutes

* The student receives the Signal Mapper Badge

### **17\. Scoring**

* Correct on first attempt: 100 points

* Correct after retry: 50 points

* Correct Reason Chip: 50 bonus points

* Streak of 5: score multiplier ×2 until the next mistake

* Speed bonus: small, optional, never more than 10% of total

**Stars:**

* 1 star: complete the level

* 2 stars: 80% first-attempt accuracy

* 3 stars: 90% first-attempt accuracy and 80% Reason Chips correct

### **18\. Asset Checklist**

**Environment:**

* Control room background

* City skyline layer (with light-up building overlays)

* Three channel frames

* District map panel

**Card assets:**

* Card frame

* Approximately 30 feature icons

* Three category symbols

* Three Reason Chip buttons

**Chimpu animations:**

* Idle at console: 4 frames

* Nod: 4 frames

* Thinking: 4 frames

* Pointing: 4 frames

* Salute celebration: 6 frames

**Interface:**

* Streak meter

* Signal counter

* Three badge icons

* Pause and sound buttons

### **19\. Audio Requirements**

**Music:**

* Cool electronic "control room" loop

* Approximately 60 seconds, seamless loop

**Sound effects:**

* Card arrive

* Swipe whoosh

* Channel correct

* Card bounce

* Streak increase

* Building light-up

* Badge earned

### **20\. Accessibility Requirements**

* Every channel uses color, icon and label together

* Minimum touch target: 64 × 64 logical pixels

* No timer in Level 1; drift speed adjustable in settings

* Swipe and tap-button alternatives

* Reduced-motion mode disables light trails

* Sound controls and captions for all voice lines

* Card text at Grade 6 reading level, 1–6 words

### **21\. Technical Requirements**

* Build as a Phaser Scene inside the React portal

* Use the shared Swipe Sorter engine

* Load all cards from JSON so content can be edited without code changes

* Randomize card order per session

* Save progress after each level

* Keep the game below approximately 15–20 MB

* Target 60 FPS on low-end tablets and school computers

**Suggested card data fields:**

* Card ID

* Level

* Label text

* Icon reference

* Correct channel

* Reason chip answer

* Hint text

* Difficulty

### **22\. Completion Criteria**

**The game is complete when:**

* All three channels route correctly with swipe, tap and keyboard

* Every incorrect routing shows a one-line explanation

* Level 3 feature pairs work correctly

* Reason Chips and scoring work as specified

* Progress saves after each level

* A normal session lasts approximately 5–6 minutes

* Students can complete the game without teacher assistance

