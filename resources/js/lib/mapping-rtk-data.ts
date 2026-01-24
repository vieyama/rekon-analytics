import stringSimilarity from 'string-similarity';

export function mappingRtk(rtkTempData: string[][]) {
    const result = [];
    let currentGroup = null;

    for (const row of rtkTempData) {
        const [id, identification, root_problems, fixing_activity, implementation_activity] = row;

        if (root_problems && fixing_activity) {
            currentGroup = {
                identification: identification || '',
                root_problems,
                fixing_activity,
                implementation_activity: ''
            };
            result.push(currentGroup);
        }

        if (currentGroup && implementation_activity) {
            currentGroup.implementation_activity = currentGroup.implementation_activity
                ? `${currentGroup.implementation_activity}\n${implementation_activity}`
                : implementation_activity;
        }
    }

    return result
}

function normalize(str: string) {
    return str.replace(/^[A-Z](\.\d+)+\s*/, '').toLowerCase().trim();
}

export function scoringData(
    primaryData: {
        identification: string;
        root_problems: string;
        fixing_activity: string;
        implementation_activity: string;
    }[],
    identificationData: string[],
    rootProblemData: string[],
    fixingActivityData: string[],
    implementationActivityData: string[]
) {
    const normalizedIdentification = identificationData.map(normalize);
    const normalizedRootProblems = rootProblemData.map(normalize);
    const normalizedFixingActivity = fixingActivityData.map(normalize);
    const normalizedImplementationActivity = implementationActivityData.map(normalize);

    return primaryData.map((item) => {
        const identification = normalize(item.identification);
        const rootProblems = normalize(item.root_problems);
        const fixingActivity = normalize(item.fixing_activity);
        
        const rawActivities = (item.implementation_activity || "").split('\n').filter(Boolean);
        const implementationActivities = rawActivities.map(normalize);

        // Step 1
        const hasIdentification = normalizedIdentification.includes(identification);
        const identification_score = hasIdentification ? 100 : 0;

        // Step 2
        const hasRootProblem = hasIdentification && normalizedRootProblems.includes(rootProblems);
        const root_problem_score = hasRootProblem ? 100 : 0;

        // Step 3
        let fixing_activity_score = 0;
        if (root_problem_score === 100) {
            const { bestMatch } = stringSimilarity.findBestMatch(fixingActivity, normalizedFixingActivity);
            fixing_activity_score = Math.round(bestMatch.rating * 100);
        }

        // Step 4
        let implementation_activity_score = 0;
        if (fixing_activity_score > 0 && implementationActivities.length > 0) {
            const scores = implementationActivities.map(normAct => {
                const { bestMatch } = stringSimilarity.findBestMatch(normAct, normalizedImplementationActivity);
                return bestMatch.rating;
            });
            const maxScore = Math.max(...scores);
            implementation_activity_score = parseFloat((maxScore * 100).toFixed(2));

        }

        let final_score = 0
        const totalScore =
            identification_score +
            root_problem_score +
            fixing_activity_score +
            implementation_activity_score;

        final_score = parseFloat((totalScore / 400 * 100).toFixed(2));

        return {
            identification_score,
            root_problem_score,
            fixing_activity_score,
            implementation_activity_score,
            final_score
        };
    });
}
