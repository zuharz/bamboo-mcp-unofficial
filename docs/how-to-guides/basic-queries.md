# Basic HR Queries Tutorial

This tutorial teaches you the essential patterns for querying your BambooHR data through Claude. You'll learn the most common HR questions and how to ask them naturally.

## What You'll Learn

- Discovery patterns for exploring your data
- Employee search and information queries  
- Time-off and scheduling queries
- Team and department insights
- Best practices for natural language queries

## Prerequisites

- Completed [Getting Started Tutorial](getting-started.md)
- BambooHR MCP server is running in Claude

## Discovery Queries

Always start by discovering what data is available in your specific BambooHR setup.

### Explore Available Datasets
```
What BambooHR datasets are available?
```

**What you'll see:** A list of all datasets like `employees`, `time_off`, `directory`, etc.

### Explore Dataset Fields
```
What fields are available in the employee dataset?
```

**What you'll see:** All the fields you can query, like `firstName`, `department`, `hireDate`, etc.

### Explore Custom Fields
```
Show me all custom fields in our BambooHR setup
```

**What you'll see:** Any custom fields your organization has configured.

## Employee Information Queries

### Find Specific Employees
```
Find John Smith's contact information
```

```
Look up employee ID 123
```

```
Find employees with the email domain @company.com
```

### Search by Attributes
```
Show me all employees in the Engineering department
```

```
Find employees hired in 2023
```

```
Who works in the San Francisco office?
```

## Time-Off and Scheduling

### Current Time-Off Status
```
Who's out of the office today?
```

```
Show me who's on vacation this week
```

```
What time-off requests are pending approval?
```

### Time-Off Planning
```
Show me all approved time-off for next month
```

```
Who's taking vacation in December?
```

```
What are the current time-off balances for my team?
```

## Team and Department Insights

### Team Information
```
Show me my Engineering team roster
```

```
Get contact information for the Marketing department
```

```
Who are the managers in our organization?
```

### Organizational Structure
```
Show me the org chart starting from the CEO
```

```
What departments do we have?
```

```
Who reports to Sarah Johnson?
```

## Workforce Analytics

### Demographic Insights
```
Analyze our workforce demographics by department
```

```
Show me tenure analysis for all employees
```

```
What's our employee distribution by location?
```

### Custom Reports
```
What custom reports are available?
```

```
Run the monthly headcount report
```

```
Show me the quarterly hiring summary
```

## Query Best Practices

###  Good Query Patterns

**Be specific about what you want:**
```
 "Show me employees in Engineering with their email addresses"
 "Show me engineering people"
```

**Use natural language:**
```
 "Who's out next week?"
 "bamboo_whos_out start_date=2024-01-15"
```

**Ask follow-up questions:**
```
"Show me the Marketing team"
→ "What are their job titles?"
→ "Who's their manager?"
```

###  Effective Query Types

**Discovery-first approach:**
1. "What datasets are available?"
2. "What fields are in the employee dataset?"
3. "Show me employees in Sales"

**Progressive refinement:**
1. "Show me all employees"
2. "Filter to just the Engineering department"
3. "Show only their contact information"

**Context-building queries:**
1. "Who's my team?"
2. "When are they taking time off?"
3. "What's their contact info?"

## Common Query Patterns

### Employee Directory Patterns
```
# Find by name
"Find Sarah Chen"

# Find by department  
"Show me all Finance employees"

# Find by location
"Who works in the NYC office?"

# Find by role
"Show me all Software Engineers"
```

### Time-Off Patterns
```
# Current status
"Who's out today?"

# Upcoming time-off
"Show me next week's time-off"

# Specific person
"When is John taking vacation?"

# Department planning
"Show Engineering time-off for Q4"
```

### Analytics Patterns
```
# Department breakdown
"Analyze headcount by department"

# Tenure analysis
"Show me employee tenure statistics"

# Growth trends
"Compare hiring in 2023 vs 2024"

# Custom insights
"Run workforce analytics for remote employees"
```

## Next Steps

 **You've mastered the basics!** 

**Ready for more advanced topics?**
- [Workforce Analytics Guide](../how-to-guides/workforce-analytics.md) - Deep analytics
- [API Reference](../reference/api.md) - All available tools
- [Troubleshooting](../how-to-guides/troubleshooting.md) - When things go wrong

## Practice Exercises

Try these queries with your own data:

1. **Discovery:** Find what departments exist in your organization
2. **Search:** Look up your own employee record  
3. **Team:** Find your manager and their contact info
4. **Time-off:** Check who's out next week
5. **Analytics:** Run a basic workforce breakdown by location

**Tip:** Start simple and build complexity. Claude learns from your conversation context! 