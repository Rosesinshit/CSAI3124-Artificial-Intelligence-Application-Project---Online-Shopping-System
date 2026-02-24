# Project Scope and Activity List
## Online Shopping System - CSAI3124

---

# Project Scope

## 0. System Initiating
0.1 Project kickoff and team formation
    0.1.1 Form project team and assign initial roles
    0.1.2 Conduct project kickoff meeting
    0.1.3 Establish communication channels and collaboration tools
0.2 Project charter development
    0.2.1 Define project mission and objectives
    0.2.2 Define team roles, responsibilities, and skill sets
    0.2.3 Establish decision-making and conflict resolution mechanisms
    0.2.4 Finalize and sign team charter
0.3 Project planning
    0.3.1 Develop project scope statement
    0.3.2 Create Work Breakdown Structure (WBS)
    0.3.3 Develop project schedule and Gantt chart
    0.3.4 Identify project risks and mitigation strategies
    0.3.5 Set up version control repository (GitHub)

## 1. System Analysis
1.1 Background study on e-commerce systems and similar online shopping platforms
1.2 Requirement collection
    1.2.1 Analyze system specification document for Block A, B, C, S, U, Y requirements
    1.2.2 Develop initial prototype for stakeholder demonstration
    1.2.3 Validate requirements with team members
    1.2.4 Compile finalized requirement specification document
1.3 Technology stack selection and evaluation

## 2. System Design
2.1 Design the overall software architecture (frontend, backend, database)
2.2 Design database schema for products, users, orders, and recommendations
2.3 Design RESTful API interfaces
2.4 Design storefront user interfaces (customer-facing)
2.5 Design administration portal interfaces (vendor-facing)
2.6 Design AI recommendation algorithm architecture
2.7 Design SEO-friendly URL structure and meta tag strategy

## 3. System Implementation

### 3.1 Block A - Core Functions
3.1.1 Implement user registration and authentication (A1-A2)
3.1.2 Implement product listing and detail pages (A3-A6)
3.1.3 Implement shopping cart functionality (A7-A10)
3.1.4 Implement checkout and order creation (A11-A13)
3.1.5 Implement admin portal - product management (A14-A17)
3.1.6 Implement admin portal - order management (A18-A20)

### 3.2 Block B - Multiple Photos and Order Processing
3.2.1 Implement multiple photo upload and display (B1)
3.2.2 Implement order status workflow with 4+ statuses (B2)
3.2.3 Implement order status filtering for customers (B3)
3.2.4 Implement order status change date tracking (B4)

### 3.3 Block C - Advanced Product Search and Navigation
3.3.1 Implement extended product attributes with HTML support (C1)
3.3.2 Implement multi-attribute keyword search (C2)
3.3.3 Implement category/price/tag filtering (C3)
3.3.4 Implement related products display (C4)
3.3.5 Implement admin attribute editing (C5)

### 3.4 Block S - Product Recommendations (AI)
3.4.1 Implement user behavior data collection
3.4.2 Develop AI recommendation model
3.4.3 Implement recommendation API endpoints
3.4.4 Integrate recommendations into storefront UI

### 3.5 Block U - Wish List and Promotional Pricing
3.5.1 Implement wish list CRUD operations
3.5.2 Implement price drop notification system
3.5.3 Implement promotional pricing strategy management

### 3.6 Block Y - Search Engine Optimization
3.6.1 Implement SEO-friendly URL routing
3.6.2 Implement meta tags and Open Graph tags
3.6.3 Implement structured data (JSON-LD)
3.6.4 Optimize page indexing and sitemap generation

### 3.7 Integration and Testing
3.7.1 Integrate all frontend and backend modules
3.7.2 Perform unit testing for each module
3.7.3 Perform integration testing
3.7.4 Perform performance and stress testing
3.7.5 Conduct User Acceptance Testing (UAT)
3.7.6 Bug fixing and optimization

### 3.8 Documentation
3.8.1 Write technical documentation
3.8.2 Write user manual
3.8.3 Prepare final project report

## 4. System Deployment
4.1 Set up production server environment
4.2 Deploy web application to production server
4.3 Configure domain and SSL certificate
4.4 Prepare project presentation materials
4.5 Conduct final project presentation

---

# Activity List

| Activity | Description | Duration (days) | Predecessor/Dependency | Assigned To |
|----------|-------------|-----------------|------------------------|-------------|
| **0. System Initiating** | | | | |
| 0.1.1 | Form project team and assign initial roles | 1 | - | All |
| 0.1.2 | Conduct project kickoff meeting | 1 | 0.1.1 | All |
| 0.1.3 | Establish communication channels and tools | 1 | 0.1.1 | M1 |
| 0.2.1 | Define project mission and objectives | 1 | 0.1.2 | M1 |
| 0.2.2 | Define team roles and responsibilities | 1 | 0.2.1 | All |
| 0.2.3 | Establish decision-making and conflict resolution | 1 | 0.2.2 | M1 |
| 0.2.4 | Finalize and sign team charter | 1 | 0.2.3 | All |
| 0.3.1 | Develop project scope statement | 2 | 0.2.4 | M1 |
| 0.3.2 | Create Work Breakdown Structure (WBS) | 2 | 0.3.1 | M1 |
| 0.3.3 | Develop project schedule and Gantt chart | 2 | 0.3.2 | M1 |
| 0.3.4 | Identify project risks and mitigation strategies | 1 | 0.3.1 | All |
| 0.3.5 | Set up version control repository (GitHub) | 1 | 0.1.3 | M2 |
| **1. System Analysis** | | | | |
| 1.1 | Background study on e-commerce systems | 3 | 0.3.3 | All |
| 1.2.1 | Analyze system specification document | 2 | 1.1 | All |
| 1.2.2 | Develop initial prototype | 4 | 1.2.1 | M1, M3 |
| 1.2.3 | Validate requirements with team | 1 | 1.2.2 | All |
| 1.2.4 | Compile requirement specification | 2 | 1.2.3 | M1 |
| 1.3 | Technology stack selection | 3 | 1.2.1 | M1, M2 |
| **2. System Design** | | | | |
| 2.1 | Design software architecture | 5 | 1.2.4, 1.3 | M1, M2 |
| 2.2 | Design database schema | 5 | 2.1 | M2 |
| 2.3 | Design RESTful API interfaces | 5 | 2.1 | M2 |
| 2.4 | Design storefront UI | 7 | 2.1 | M3 |
| 2.5 | Design admin portal UI | 5 | 2.1 | M3 |
| 2.6 | Design AI recommendation architecture | 5 | 2.1 | M4 |
| 2.7 | Design SEO strategy | 3 | 2.1 | M5 |
| **3.1 Block A - Core Functions** | | | | |
| 3.1.1 | Implement user registration & authentication | 5 | 2.2, 2.3 | M1 |
| 3.1.2 | Implement product listing & detail pages | 6 | 2.2, 2.3, 2.4 | M1, M3 |
| 3.1.3 | Implement shopping cart functionality | 5 | 3.1.2 | M1, M3 |
| 3.1.4 | Implement checkout & order creation | 5 | 3.1.3 | M1, M2 |
| 3.1.5 | Implement admin product management | 6 | 2.2, 2.3, 2.5 | M1, M2 |
| 3.1.6 | Implement admin order management | 5 | 3.1.4, 3.1.5 | M1, M2 |
| **3.2 Block B - Multiple Photos & Order Processing** | | | | |
| 3.2.1 | Implement multiple photo upload & display | 4 | 3.1.2 | M2, M3 |
| 3.2.2 | Implement order status workflow | 5 | 3.1.4 | M2 |
| 3.2.3 | Implement order status filtering | 3 | 3.2.2 | M2 |
| 3.2.4 | Implement status change date tracking | 2 | 3.2.2 | M2 |
| **3.3 Block C - Advanced Search & Navigation** | | | | |
| 3.3.1 | Implement extended product attributes | 4 | 3.1.2 | M3 |
| 3.3.2 | Implement multi-attribute search | 4 | 3.3.1 | M3 |
| 3.3.3 | Implement category/price/tag filtering | 4 | 3.3.2 | M3 |
| 3.3.4 | Implement related products display | 3 | 3.3.1 | M3 |
| 3.3.5 | Implement admin attribute editing | 3 | 3.3.1, 3.1.5 | M3 |
| **3.4 Block S - Product Recommendations (AI)** | | | | |
| 3.4.1 | Implement user behavior data collection | 5 | 3.1.2, 3.1.3 | M4 |
| 3.4.2 | Develop AI recommendation model | 10 | 2.6, 3.4.1 | M4 |
| 3.4.3 | Implement recommendation API endpoints | 4 | 3.4.2 | M4 |
| 3.4.4 | Integrate recommendations into UI | 3 | 3.4.3 | M4, M3 |
| **3.5 Block U - Wish List & Promotional Pricing** | | | | |
| 3.5.1 | Implement wish list CRUD operations | 4 | 3.1.2 | M5 |
| 3.5.2 | Implement price drop notifications | 4 | 3.5.1 | M5 |
| 3.5.3 | Implement promotional pricing management | 5 | 3.5.1 | M5, M4 |
| **3.6 Block Y - SEO Optimization** | | | | |
| 3.6.1 | Implement SEO-friendly URL routing | 3 | 3.1.2 | M5 |
| 3.6.2 | Implement meta tags & Open Graph | 3 | 3.6.1 | M5 |
| 3.6.3 | Implement structured data (JSON-LD) | 3 | 3.6.2 | M5 |
| 3.6.4 | Optimize page indexing & sitemap | 2 | 3.6.3 | M5 |
| **3.7 Integration & Testing** | | | | |
| 3.7.1 | Integrate all modules | 5 | 3.1.6, 3.2.4, 3.3.5, 3.4.4, 3.5.3, 3.6.4 | All |
| 3.7.2 | Unit testing | 5 | 3.7.1 | All |
| 3.7.3 | Integration testing | 5 | 3.7.2 | M5, All |
| 3.7.4 | Performance & stress testing | 3 | 3.7.3 | M2 |
| 3.7.5 | User Acceptance Testing (UAT) | 3 | 3.7.4 | All |
| 3.7.6 | Bug fixing & optimization | 5 | 3.7.5 | All |
| **3.8 Documentation** | | | | |
| 3.8.1 | Write technical documentation | 5 | 3.7.1 | M5 |
| 3.8.2 | Write user manual | 3 | 3.7.3 | M5 |
| 3.8.3 | Prepare final project report | 5 | 3.7.6, 3.8.1, 3.8.2 | M1, M5 |
| **4. System Deployment** | | | | |
| 4.1 | Set up production server | 2 | 3.7.4 | M2 |
| 4.2 | Deploy application to production | 2 | 4.1, 3.7.6 | M2 |
| 4.3 | Configure domain & SSL | 1 | 4.2 | M2 |
| 4.4 | Prepare presentation materials | 3 | 3.8.3 | All |
| 4.5 | Conduct final presentation | 1 | 4.3, 4.4 | All |

---

## Summary Statistics

| Category | Total Activities | Total Duration (days) |
|----------|------------------|----------------------|
| System Initiating | 12 | 15 |
| System Analysis | 6 | 15 |
| System Design | 7 | 35 |
| Block A Implementation | 6 | 32 |
| Block B Implementation | 4 | 14 |
| Block C Implementation | 5 | 18 |
| Block S Implementation | 4 | 22 |
| Block U Implementation | 3 | 13 |
| Block Y Implementation | 4 | 11 |
| Integration & Testing | 6 | 26 |
| Documentation | 3 | 13 |
| Deployment | 5 | 9 |
| **Total** | **65** | **223** |

---

## Critical Path

The critical path runs through:
0.1.1 → 0.1.2 → 0.2.1 → 0.2.2 → 0.2.3 → 0.2.4 → 0.3.1 → 0.3.2 → 0.3.3 → 1.1 → 1.2.1 → 1.2.2 → 1.2.3 → 1.2.4 → 2.1 → 2.2 → 3.1.1 → 3.1.2 → 3.1.3 → 3.1.4 → 3.2.2 → 3.2.3 → 3.7.1 → 3.7.2 → 3.7.3 → 3.7.4 → 3.7.5 → 3.7.6 → 4.2 → 4.3 → 4.5

---

*Document Version: 1.1*
*Created Date: January 2026*
*Last Updated: February 2026*

