--
-- PostgreSQL database dump
--

-- Dumped from database version 12.22 (Ubuntu 12.22-0ubuntu0.20.04.4)
-- Dumped by pg_dump version 12.22 (Ubuntu 12.22-0ubuntu0.20.04.4)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categories (id, name, slug, description, image_url, is_active, created_at) FROM stdin;
1	Tablets & Capsules	tablets-capsules	Oral solid dosage forms	\N	t	2026-05-15 16:55:50.363963
2	Syrups & Liquids	syrups-liquids	Oral liquid medicines	\N	t	2026-05-15 16:55:50.363963
3	Vitamins & Supplements	vitamins-supplements	Health supplements and vitamins	\N	t	2026-05-15 16:55:50.363963
4	Ayurvedic	ayurvedic	Ayurvedic and herbal products	\N	t	2026-05-15 16:55:50.363963
5	Medical Devices	medical-devices	BP monitors, glucometers, etc	\N	t	2026-05-15 16:55:50.363963
6	Personal Care	personal-care	Skincare, haircare products	\N	t	2026-05-15 16:55:50.363963
7	First Aid	first-aid	Bandages, antiseptics, etc	\N	t	2026-05-15 16:55:50.363963
\.


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categories_id_seq', 7, true);


--
-- PostgreSQL database dump complete
--

