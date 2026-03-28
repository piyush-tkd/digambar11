-- ============================================================
-- 007: IPL 2026 Season Squads from Sportmonks (season 1795)
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- WARNING: This clears all existing player data and user teams!
-- ============================================================

-- Clear dependent tables first
DELETE FROM user_team_players;
DELETE FROM user_teams;
DELETE FROM match_players;
DELETE FROM live_scores;
DELETE FROM players;

-- ============================================================
-- CSK - Chennai Super Kings (25 players)
-- ============================================================
INSERT INTO players (external_id, name, team, role, credit, overseas) VALUES
('4856', 'Ruturaj Gaikwad', 'CSK', 'BAT', 9.5, false),
('2900', 'Sanju Samson', 'CSK', 'WK', 9.0, false),
('60723', 'Kartik Sharma', 'CSK', 'WK', 7.0, false),
('60167', 'Prashant Veer', 'CSK', 'AR', 7.0, false),
('4940', 'Shivam Dube', 'CSK', 'AR', 8.5, false),
('8490', 'Noor Ahmad', 'CSK', 'BWL', 7.5, true),
('3296', 'Rahul Chahar', 'CSK', 'BWL', 7.5, false),
('322', 'Khaleel Ahmed', 'CSK', 'BWL', 7.5, false),
('274', 'Mahendra Singh Dhoni', 'CSK', 'WK', 8.0, false),
('53078', 'Anshul Kamboj', 'CSK', 'AR', 7.0, false),
('31028', 'Gurjapneet Singh', 'CSK', 'BWL', 7.0, false),
('35309', 'Dewald Brevis', 'CSK', 'BAT', 8.0, true),
('7083', 'Akeal Hosein', 'CSK', 'BWL', 7.5, true),
('214', 'Matt Henry', 'CSK', 'BWL', 7.5, true),
('397', 'Matthew Short', 'CSK', 'AR', 8.0, true),
('3491', 'Jamie Overton', 'CSK', 'BWL', 7.5, true),
('36716', 'Zak Foulkes', 'CSK', 'AR', 6.5, true),
('2774', 'Sarfaraz Khan', 'CSK', 'BAT', 8.0, false),
('36473', 'Aman Hakim Khan', 'CSK', 'BWL', 6.5, false),
('57345', 'Ayush Mhatre', 'CSK', 'AR', 7.0, false),
('57613', 'Ramakrishna Ghosh', 'CSK', 'BWL', 6.0, false),
('34463', 'Urvil Patel', 'CSK', 'WK', 6.5, false),
('34319', 'Mukesh Choudhary', 'CSK', 'BWL', 6.5, false),
('2846', 'Shreyas Gopal', 'CSK', 'AR', 7.0, false),
('911', 'Spencer Johnson', 'CSK', 'BWL', 8.0, true);

-- ============================================================
-- MI - Mumbai Indians (25 players)
-- ============================================================
INSERT INTO players (external_id, name, team, role, credit, overseas) VALUES
('284', 'Jasprit Bumrah', 'MI', 'BWL', 10.0, false),
('281', 'Hardik Pandya', 'MI', 'AR', 9.5, false),
('2879', 'Suryakumar Yadav', 'MI', 'BAT', 9.5, false),
('278', 'Rohit Sharma', 'MI', 'BAT', 9.0, false),
('221', 'Trent Boult', 'MI', 'BWL', 8.5, true),
('279', 'Deepak Chahar', 'MI', 'BWL', 8.0, false),
('8370', 'Tilak Varma', 'MI', 'BAT', 8.5, false),
('53075', 'Naman Dhir', 'MI', 'AR', 7.0, false),
('3806', 'Will Jacks', 'MI', 'BAT', 8.5, true),
('40997', 'AM Ghazanfar', 'MI', 'BWL', 7.0, true),
('128', 'Sherfane Rutherford', 'MI', 'BAT', 7.5, true),
('227', 'Mitchell Santner', 'MI', 'AR', 8.0, true),
('60', 'Shardul Thakur', 'MI', 'BWL', 7.5, false),
('662', 'Ryan Rickelton', 'MI', 'WK', 7.5, true),
('77', 'Quinton de Kock', 'MI', 'WK', 8.5, true),
('4337', 'Corbin Bosch', 'MI', 'AR', 7.0, true),
('39047', 'Robin Minz', 'MI', 'WK', 6.5, false),
('60728', 'Mohammed Salahuddin Izhar', 'MI', 'BWL', 6.0, false),
('60480', 'Danish Malewar', 'MI', 'BAT', 6.0, false),
('35051', 'Raj Angad Bawa', 'MI', 'AR', 6.5, false),
('58342', 'Ashwani Kumar', 'MI', 'BWL', 6.0, false),
('8388', 'Atharva Ankolekar', 'MI', 'BAT', 6.0, false),
('22935', 'Raghu Sharma', 'MI', 'AR', 6.0, false),
('3347', 'Mayank Markande', 'MI', 'BWL', 6.5, false),
('59490', 'Mayank Rawat', 'MI', 'AR', 6.0, false);

-- ============================================================
-- RCB - Royal Challengers Bengaluru (25 players)
-- ============================================================
INSERT INTO players (external_id, name, team, role, credit, overseas) VALUES
('46', 'Virat Kohli', 'RCB', 'BAT', 10.5, false),
('191', 'Josh Hazlewood', 'RCB', 'BWL', 8.5, true),
('3431', 'Philip Salt', 'RCB', 'WK', 9.0, true),
('26027', 'Rajat Patidar', 'RCB', 'BAT', 8.0, false),
('3092', 'Jitesh Sharma', 'RCB', 'WK', 7.5, false),
('280', 'Bhuvneshwar Kumar', 'RCB', 'BWL', 8.0, false),
('26042', 'Venkatesh Iyer', 'RCB', 'AR', 8.0, false),
('4898', 'Rasikh Salam Dar', 'RCB', 'BWL', 7.0, false),
('2687', 'Krunal Pandya', 'RCB', 'AR', 7.5, false),
('60731', 'Mangesh Yadav', 'RCB', 'AR', 6.0, false),
('36524', 'Yash Dayal', 'RCB', 'BWL', 7.5, false),
('617', 'Tim David', 'RCB', 'BAT', 8.5, true),
('44513', 'Suyash Sharma', 'RCB', 'BWL', 6.5, false),
('26819', 'Jacob Bethell', 'RCB', 'AR', 8.0, true),
('4931', 'Devdutt Padikkal', 'RCB', 'BAT', 7.5, false),
('4799', 'Jacob Duffy', 'RCB', 'BWL', 7.0, true),
('21924', 'Nuwan Thushara', 'RCB', 'BWL', 7.0, true),
('5222', 'Romario Shepherd', 'RCB', 'BAT', 7.0, true),
('5132', 'Jordan Cox', 'RCB', 'WK', 7.0, true),
('3098', 'Swapnil Singh', 'RCB', 'AR', 6.5, false),
('60732', 'Satvik Deswal', 'RCB', 'BWL', 6.0, false),
('59055', 'Kanishk Chouhan', 'RCB', 'AR', 6.0, false),
('57679', 'Abhinandan Singh', 'RCB', 'BWL', 6.0, false),
('60733', 'Vihaan Manoj Malhotra', 'RCB', 'AR', 6.0, false),
('35060', 'Vicky Kanhaiya Ostwal', 'RCB', 'BWL', 6.5, false);

-- ============================================================
-- KKR - Kolkata Knight Riders (26 players)
-- ============================================================
INSERT INTO players (external_id, name, team, role, credit, overseas) VALUES
('630', 'Cameron Green', 'KKR', 'AR', 9.5, true),
('10395', 'Matheesha Pathirana', 'KKR', 'BWL', 8.5, true),
('3215', 'Rinku Singh', 'KKR', 'BAT', 8.5, false),
('4877', 'Varun Chakaravarthy', 'KKR', 'BWL', 8.5, false),
('758', 'Sunil Narine', 'KKR', 'BWL', 9.0, true),
('237', 'Mustafizur Rahman', 'KKR', 'BWL', 7.5, true),
('24822', 'Ramandeep Singh', 'KKR', 'BAT', 7.0, false),
('59804', 'Tejasvi Dahiya', 'KKR', 'WK', 6.5, false),
('35066', 'Angkrish Raghuvanshi', 'KKR', 'BAT', 7.0, false),
('5594', 'Rachin Ravindra', 'KKR', 'BAT', 8.0, true),
('10623', 'Finn Allen', 'KKR', 'BAT', 7.5, true),
('24882', 'Vaibhav Arora', 'KKR', 'BWL', 7.0, false),
('118', 'Rovman Powell', 'KKR', 'BAT', 7.5, true),
('208', 'Tim Seifert', 'KKR', 'WK', 7.0, true),
('51', 'Ajinkya Rahane', 'KKR', 'BAT', 7.5, false),
('33572', 'Umran Malik', 'KKR', 'BWL', 7.0, false),
('3305', 'Rahul Tripathi', 'KKR', 'BAT', 7.0, false),
('276', 'Manish Pandey', 'KKR', 'BAT', 7.0, false),
('3350', 'Anukul Roy', 'KKR', 'AR', 6.5, false),
('60725', 'Daksh Kamra', 'KKR', 'AR', 6.0, false),
('6775', 'Prashant Solanki', 'KKR', 'BWL', 6.5, false),
('9462', 'Kartik Tyagi', 'KKR', 'BWL', 6.5, false),
('59505', 'Sarthak Ranjan', 'KKR', 'BAT', 6.0, false),
('2537', 'Blessing Muzarabani', 'KKR', 'BWL', 7.5, true),
('36512', 'Saurabh Dubey', 'KKR', 'BWL', 6.0, false),
('3158', 'Navdeep Saini', 'KKR', 'BWL', 7.0, false);

-- ============================================================
-- DC - Delhi Capitals (25 players)
-- ============================================================
INSERT INTO players (external_id, name, team, role, credit, overseas) VALUES
('815', 'Axar Patel', 'DC', 'AR', 9.0, false),
('47', 'Lokesh Rahul', 'DC', 'WK', 9.5, false),
('56', 'Kuldeep Yadav', 'DC', 'BWL', 8.5, false),
('36', 'Mitchell Starc', 'DC', 'BWL', 9.5, true),
('3218', 'Thangarasu Natarajan', 'DC', 'BWL', 7.5, false),
('25797', 'Tristan Stubbs', 'DC', 'WK', 8.0, true),
('60724', 'Auqib Nabi', 'DC', 'BWL', 6.5, false),
('23943', 'Mukesh Kumar', 'DC', 'BWL', 7.0, false),
('2858', 'Nitish Rana', 'DC', 'BAT', 7.5, false),
('50576', 'Abishek Porel', 'DC', 'WK', 7.0, false),
('6403', 'Pathum Nissanka', 'DC', 'BAT', 8.0, true),
('53087', 'Ashutosh Sharma', 'DC', 'BAT', 7.0, false),
('4712', 'Kyle Jamieson', 'DC', 'BWL', 8.0, true),
('68', 'Lungi Ngidi', 'DC', 'BWL', 8.0, true),
('670', 'Ben Duckett', 'DC', 'WK', 8.0, true),
('79', 'David Miller', 'DC', 'BAT', 8.0, true),
('53057', 'Sameer Rizvi', 'DC', 'BAT', 7.0, false),
('48', 'Prithvi Shaw', 'DC', 'BAT', 7.0, false),
('170', 'Dushmantha Chameera', 'DC', 'BWL', 7.0, true),
('57614', 'Vipraj Nigam', 'DC', 'BWL', 6.0, false),
('2912', 'Karun Nair', 'DC', 'BAT', 8.0, false),
('58239', 'Madhav Tiwari', 'DC', 'AR', 6.0, false),
('57235', 'Sahil Parakh', 'DC', 'BWL', 6.0, false),
('58245', 'Tripurana Vijay', 'DC', 'AR', 6.0, false),
('44507', 'Ajay Mandal', 'DC', 'AR', 6.0, false);

-- ============================================================
-- SRH - Sunrisers Hyderabad (25 players)
-- ============================================================
INSERT INTO players (external_id, name, team, role, credit, overseas) VALUES
('65', 'Heinrich Klaasen', 'SRH', 'WK', 9.5, true),
('190', 'Pat Cummins', 'SRH', 'BWL', 9.5, true),
('3338', 'Abhishek Sharma', 'SRH', 'AR', 8.5, false),
('26', 'Travis Head', 'SRH', 'BAT', 9.5, true),
('780', 'Liam Livingstone', 'SRH', 'AR', 8.5, true),
('3122', 'Ishan Kishan', 'SRH', 'WK', 8.5, false),
('2744', 'Harshal Patel', 'SRH', 'BWL', 8.0, false),
('22134', 'Nitish Kumar Reddy', 'SRH', 'BAT', 8.0, false),
('8406', 'Salil Arora', 'SRH', 'BAT', 6.5, false),
('48866', 'Eshan Malinga', 'SRH', 'BWL', 7.0, true),
('4061', 'Brydon Carse', 'SRH', 'BWL', 8.0, true),
('2795', 'Jaydev Unadkat', 'SRH', 'BWL', 7.5, false),
('3368', 'Shivam Mavi', 'SRH', 'BWL', 7.0, false),
('914', 'Kamindu Mendis', 'SRH', 'AR', 8.0, true),
('57680', 'Zeeshan Ansari', 'SRH', 'BWL', 6.0, false),
('58883', 'Onkar Tarmale', 'SRH', 'BWL', 6.0, false),
('60734', 'Amit Kumar', 'SRH', 'BWL', 6.0, false),
('60735', 'Shivang Kumar', 'SRH', 'BWL', 6.0, false),
('60736', 'Krains Bhaveshbhai Fuletra', 'SRH', 'BWL', 6.0, false),
('57681', 'Aniket Verma', 'SRH', 'BAT', 6.0, false),
('53063', 'Sakib Hussain', 'SRH', 'AR', 6.0, false),
('60737', 'Ravichandran Smaran', 'SRH', 'BAT', 6.0, false),
('60484', 'Praful Hinge', 'SRH', 'BWL', 6.0, false),
('34358', 'Harsh Dubey', 'SRH', 'BWL', 6.5, false),
('3914', 'David Payne', 'SRH', 'BWL', 7.0, true);

-- ============================================================
-- RR - Rajasthan Royals (25 players)
-- ============================================================
INSERT INTO players (external_id, name, team, role, credit, overseas) VALUES
('6820', 'Yashasvi Jaiswal', 'RR', 'BAT', 10.0, false),
('8391', 'Dhruv Jurel', 'RR', 'WK', 8.0, false),
('4922', 'Riyan Parag', 'RR', 'BAT', 8.5, false),
('55', 'Ravindra Jadeja', 'RR', 'AR', 9.0, false),
('424', 'Jofra Archer', 'RR', 'BWL', 9.0, true),
('108', 'Shimron Hetmyer', 'RR', 'BAT', 8.0, true),
('9459', 'Ravi Bishnoi', 'RR', 'BWL', 7.5, false),
('6697', 'Tushar Deshpande', 'RR', 'BWL', 7.5, false),
('2966', 'Sandeep Sharma', 'RR', 'BWL', 7.0, false),
('4346', 'Nandre Burger', 'RR', 'BWL', 7.5, true),
('35321', 'Kwena Maphaka', 'RR', 'BWL', 7.5, true),
('57622', 'Vaibhav Suryavanshi', 'RR', 'BAT', 7.0, false),
('6472', 'Donovan Ferreira', 'RR', 'WK', 7.0, true),
('60289', 'Ravi Singh', 'RR', 'WK', 6.0, false),
('8397', 'Sushant Mishra', 'RR', 'BWL', 6.5, false),
('34355', 'Shubham Dubey', 'RR', 'BAT', 6.5, false),
('36497', 'Kuldeep Sen', 'RR', 'BWL', 6.5, false),
('26024', 'Yudhvir Singh Charak', 'RR', 'BWL', 6.0, false),
('60085', 'Yash Raj Punja', 'RR', 'AR', 6.0, false),
('60729', 'Brijesh Sharma', 'RR', 'BWL', 6.0, false),
('48821', 'Vignesh Puthur', 'RR', 'AR', 6.0, false),
('60730', 'Aman Rao Perala', 'RR', 'BAT', 6.0, false),
('53165', 'Lhuan-dre Pretorius', 'RR', 'WK', 7.0, true),
('178', 'Dasun Shanaka', 'RR', 'AR', 7.5, true),
('4712', 'Kyle Jamieson', 'RR', 'BWL', 8.0, true);

-- ============================================================
-- PBKS - Punjab Kings (25 players)
-- ============================================================
INSERT INTO players (external_id, name, team, role, credit, overseas) VALUES
('2813', 'Shreyas Iyer', 'PBKS', 'BAT', 9.5, false),
('4880', 'Arshdeep Singh', 'PBKS', 'BWL', 9.0, false),
('273', 'Yuzvendra Chahal', 'PBKS', 'BWL', 8.5, false),
('199', 'Marcus Stoinis', 'PBKS', 'AR', 9.0, true),
('6478', 'Marco Jansen', 'PBKS', 'AR', 8.5, true),
('3167', 'Shashank Singh', 'PBKS', 'AR', 7.5, false),
('1052', 'Ben Dwarshuis', 'PBKS', 'BWL', 7.5, true),
('8373', 'Nehal Wadhera', 'PBKS', 'BAT', 7.0, false),
('6496', 'Prabhsimran Singh', 'PBKS', 'WK', 7.0, false),
('57620', 'Priyansh Arya', 'PBKS', 'BAT', 7.0, false),
('24153', 'Mitchell Owen', 'PBKS', 'AR', 7.0, true),
('10131', 'Cooper Connolly', 'PBKS', 'AR', 7.0, true),
('343', 'Azmatullah Omarzai', 'PBKS', 'AR', 8.0, true),
('223', 'Lockie Ferguson', 'PBKS', 'BWL', 8.5, true),
('46736', 'Vijaykumar Vyshak', 'PBKS', 'BWL', 7.0, false),
('34364', 'Yash Thakur', 'PBKS', 'BWL', 7.0, false),
('4868', 'Harpreet Brar', 'PBKS', 'BWL', 7.0, false),
('3146', 'Vishnu Vinod', 'PBKS', 'WK', 6.5, false),
('947', 'Xavier Bartlett', 'PBKS', 'BWL', 7.5, true),
('60160', 'Vishal Nishad', 'PBKS', 'BWL', 6.0, false),
('6670', 'Suryansh Shedge', 'PBKS', 'BAT', 6.5, false),
('57621', 'Pyla Avinash', 'PBKS', 'BAT', 6.0, false),
('52496', 'Musheer Khan', 'PBKS', 'AR', 7.0, false),
('35018', 'Harnoor Singh', 'PBKS', 'BAT', 6.0, false),
('3053', 'Praveen Dubey', 'PBKS', 'BWL', 6.0, false);

-- ============================================================
-- GT - Gujarat Titans (25 players)
-- ============================================================
INSERT INTO players (external_id, name, team, role, credit, overseas) VALUES
('306', 'Rashid Khan', 'GT', 'BWL', 9.5, true),
('3362', 'Shubman Gill', 'GT', 'BAT', 10.0, false),
('143', 'Jos Buttler', 'GT', 'WK', 9.5, true),
('59', 'Mohammed Siraj', 'GT', 'BWL', 8.5, false),
('70', 'Kagiso Rabada', 'GT', 'BWL', 9.0, true),
('3374', 'Prasidh Krishna', 'GT', 'BWL', 7.5, false),
('28955', 'Sai Sudharsan', 'GT', 'BAT', 8.0, false),
('100', 'Jason Holder', 'GT', 'BAT', 8.0, true),
('7668', 'Shahrukh Khan', 'GT', 'BAT', 7.5, false),
('2927', 'Rahul Tewatia', 'GT', 'AR', 7.5, false),
('1211', 'Washington Sundar', 'GT', 'BAT', 7.5, false),
('7650', 'Sai Kishore', 'GT', 'BWL', 7.0, false),
('3497', 'Tom Banton', 'GT', 'BAT', 7.0, true),
('216', 'Glenn Phillips', 'GT', 'WK', 8.0, true),
('46730', 'Gurnoor Brar', 'GT', 'BWL', 6.5, false),
('36509', 'Arshad Khan', 'GT', 'AR', 6.5, false),
('36479', 'Ashok Sharma', 'GT', 'BWL', 6.0, false),
('3773', 'Luke Wood', 'GT', 'BAT', 7.0, true),
('2792', 'Jayant Yadav', 'GT', 'BWL', 6.5, false),
('288', 'Ishant Sharma', 'GT', 'BWL', 7.0, false),
('9450', 'Kumar Kushagra', 'GT', 'WK', 6.5, false),
('35048', 'Nishant Sindhu', 'GT', 'AR', 6.0, false),
('9456', 'Manav Suthar', 'GT', 'BWL', 6.5, false),
('9921', 'Anuj Rawat', 'GT', 'WK', 6.5, false),
('3203', 'Kulwant Khejroliya', 'GT', 'BWL', 6.0, false);

-- ============================================================
-- LSG - Lucknow Super Giants (25 players)
-- ============================================================
INSERT INTO players (external_id, name, team, role, credit, overseas) VALUES
('53', 'Rishabh Pant', 'LSG', 'WK', 10.0, false),
('736', 'Nicholas Pooran', 'LSG', 'WK', 9.0, true),
('36521', 'Mayank Yadav', 'LSG', 'BWL', 8.5, false),
('57', 'Mohammed Shami', 'LSG', 'BWL', 8.5, false),
('3152', 'Avesh Khan', 'LSG', 'BWL', 7.5, false),
('9927', 'Abdul Samad', 'LSG', 'AR', 7.0, false),
('36515', 'Ayush Badoni', 'LSG', 'BAT', 7.5, false),
('3353', 'Mohsin Khan', 'LSG', 'BWL', 7.0, false),
('31', 'Mitchell Marsh', 'LSG', 'AR', 8.5, true),
('60726', 'Mukul Dalip Choudhary', 'LSG', 'BAT', 6.0, false),
('9924', 'Shahbaz Ahmed', 'LSG', 'AR', 7.0, false),
('60727', 'Akshat Raghuwanshi', 'LSG', 'BAT', 6.0, false),
('4916', 'Wanindu Hasaranga', 'LSG', 'AR', 8.5, true),
('66', 'Aiden Markram', 'LSG', 'BAT', 8.0, true),
('636', 'Anrich Nortje', 'LSG', 'BWL', 8.5, true),
('52511', 'Naman Tiwari', 'LSG', 'BWL', 6.0, false),
('7389', 'Manimaran Siddharth', 'LSG', 'BWL', 6.5, false),
('6071', 'Matthew Breetzke', 'LSG', 'BAT', 7.0, true),
('57616', 'Digvesh Rathi', 'LSG', 'BWL', 6.0, false),
('52484', 'Arshin Kulkarni', 'LSG', 'AR', 6.5, false),
('23691', 'Prince Yadav', 'LSG', 'BWL', 6.0, false),
('8394', 'Akash Maharaj Singh', 'LSG', 'BWL', 6.0, false),
('6667', 'Arjun Tendulkar', 'LSG', 'BWL', 6.5, false),
('4928', 'Himmat Singh', 'LSG', 'BAT', 6.5, false),
('29114', 'Gudakesh Motie', 'LSG', 'BWL', 7.0, true);
