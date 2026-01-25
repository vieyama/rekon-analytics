export function mappingRtk(rtkTempData: string[][]) {
    const result = [];
    let currentGroup = null;

    for (const row of rtkTempData) {
        const [id, identification, root_problems, fixing_activity, implementation_activity, is_require_cost] = row;

        if (root_problems && fixing_activity) {
            currentGroup = {
                identification: identification || '',
                root_problems,
                fixing_activity,
                implementation_activity: '',
                is_require_cost: (is_require_cost || '').trim().toLowerCase() === 'ya'
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

export function normalize(str: string) {
    // Remove prefix like "A.1 ", "B.2.1 " and all non-alphanumeric characters
    return str.replace(/^[A-Z](\.\d+)+\s*/, '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function scoringData(
    primaryData: {
        identification: string;
        root_problems: string;
        fixing_activity: string;
        implementation_activity: string;
        is_require_cost?: boolean;
    }[],
    identificationData: string[],
    rootProblemData: string[]
) {
    const normalizedIdentification = identificationData.map(normalize);
    const normalizedRootProblems = rootProblemData.map(normalize);

    // Helper for parallel processing
    const processItem = (item: any) => {
        const identification = normalize(item.identification);
        const rootProblems = normalize(item.root_problems);

        // Step 1
        const hasIdentification = normalizedIdentification.includes(identification);
        const identification_score = hasIdentification ? 0.4 : 0;

        // Step 2
        const hasRootProblem = hasIdentification && normalizedRootProblems.includes(rootProblems);
        const root_problem_score = hasRootProblem ? 0.3 : 0;
        const is_school_independent_program = identification_score === 0 || root_problem_score === 0;

        return {
            identification_score,
            root_problem_score,
            is_school_independent_program
        };
    };

    return primaryData.map(item => processItem(item))
}
